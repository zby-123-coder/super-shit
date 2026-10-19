import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { wrongQuestion } from '@server/database/schema';
import type {
  SaveWrongQuestionRequest,
  WrongQuestionDTO,
} from '@shared/api.interface';
import { AccountService } from '../account/account.service';

type Row = typeof wrongQuestion.$inferSelect;

@Injectable()
export class WrongQuestionService {
  private readonly logger = new Logger(WrongQuestionService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
  ) {}

  private async assertCanView(
    userId: string,
    studentUserId: string,
  ): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    if (me.role === 'student') {
      if (userId !== studentUserId) {
        throw new ForbiddenException('只能查看自己的错题本');
      }
      return;
    }
    if (me.role === 'admin') return;
    if (me.role === 'parent') {
      const ok = await this.accountService.canViewStudent(
        userId,
        studentUserId,
      );
      if (!ok) throw new ForbiddenException('只能查看孩子的错题本');
      return;
    }
    const ok = await this.accountService.canTeachStudent(
      userId,
      studentUserId,
    );
    if (!ok) throw new ForbiddenException('只能查看学生的错题本');
  }

  async list(
    userId: string,
    studentUserId?: string,
  ): Promise<WrongQuestionDTO[]> {
    const me = await this.accountService.findProfile(userId);
    if (!me) return [];
    let target = studentUserId || '';
    if (me.role === 'parent' && !target) {
      const meData = await this.accountService.getMe(userId);
      target = meData.children[0]?.userId ?? '';
    }
    if (!target) target = userId;
    await this.assertCanView(userId, target);

    const rows: Row[] = await this.db
      .select()
      .from(wrongQuestion)
      .where(eq(wrongQuestion.studentUserId, target))
      .orderBy(desc(wrongQuestion.createdAt))
      .limit(100);
    return rows.map((row: Row) => ({
      id: row.id,
      studentUserId: row.studentUserId,
      studentName: '',
      subject: row.subject,
      chapter: row.chapter ?? '',
      title: row.title,
      reason: row.reason ?? '',
      knowledgePoint: row.knowledgePoint ?? '',
      status: row.status as 'open' | 'corrected' | 'mastered',
      createdAt: row.createdAt.toISOString(),
      reviewStage: row.reviewStage ?? 0,
      reviewCount: row.reviewCount ?? 0,
      nextReviewAt: row.nextReviewAt ? row.nextReviewAt.toISOString() : null,
    }));
  }

  async create(
    userId: string,
    dto: SaveWrongQuestionRequest,
  ): Promise<WrongQuestionDTO> {
    const me = await this.accountService.findProfile(userId);
    const target = dto.studentUserId || userId;
    const isSelf = me?.role === 'student' && userId === target;
    const isStaff = me?.role === 'teacher' || me?.role === 'admin';
    if (!isSelf && !isStaff) {
      throw new ForbiddenException('只有学生本人可以录入错题');
    }
    const inserted: Row[] = await this.db
      .insert(wrongQuestion)
      .values({
        studentUserId: target,
        subject: dto.subject,
        chapter: dto.chapter ?? null,
        title: dto.title,
        reason: dto.reason ?? null,
        knowledgePoint: dto.knowledgePoint ?? null,
        status: 'open',
      })
      .returning();
    const row = inserted[0];
    return {
      id: row.id,
      studentUserId: row.studentUserId,
      studentName: '',
      subject: row.subject,
      chapter: row.chapter ?? '',
      title: row.title,
      reason: row.reason ?? '',
      knowledgePoint: row.knowledgePoint ?? '',
      status: 'open',
      createdAt: row.createdAt.toISOString(),
      reviewStage: 0,
      reviewCount: 0,
      nextReviewAt: null,
    };
  }

  async markCorrected(id: string, userId: string): Promise<void> {
    const rows: Row[] = await this.db
      .select()
      .from(wrongQuestion)
      .where(eq(wrongQuestion.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('错题不存在');
    }
    const item = rows[0];
    const me = await this.accountService.findProfile(userId);
    const isSelf = me?.role === 'student' && userId === item.studentUserId;
    const isStaff = me?.role === 'teacher' || me?.role === 'admin';
    if (!isSelf && !isStaff) {
      throw new ForbiddenException('无权修改该错题');
    }
    await this.db
      .update(wrongQuestion)
      .set({
        status: 'corrected',
        // 订正成功即进入复习排期（艾宾浩斯间隔，可配置）
        nextReviewAt: this.nextReviewDate(item.reviewStage ?? 0),
        reviewTaskId: null,
      })
      .where(eq(wrongQuestion.id, id));
  }

  async remove(id: string, userId: string): Promise<void> {
    const rows: Row[] = await this.db
      .select()
      .from(wrongQuestion)
      .where(eq(wrongQuestion.id, id))
      .limit(1);
    if (rows.length === 0) return;
    const item = rows[0];
    const me = await this.accountService.findProfile(userId);
    const isSelf = me?.role === 'student' && userId === item.studentUserId;
    const isStaff = me?.role === 'teacher' || me?.role === 'admin';
    if (!isSelf && !isStaff) {
      throw new ForbiddenException('无权删除该错题');
    }
    await this.db.delete(wrongQuestion).where(eq(wrongQuestion.id, id));
  }

  /**
   * 艾宾浩斯复习间隔（天）。可用 WRQ_REVIEW_INTERVALS 覆盖，
   * 默认 1/3/7/15 四轮，完成后标记 mastered 不再提醒。
   */
  private reviewIntervals(): number[] {
    const raw = process.env.WRQ_REVIEW_INTERVALS;
    if (raw) {
      const parsed = raw
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (parsed.length > 0) return parsed;
    }
    return [1, 3, 7, 15];
  }

  private nextReviewDate(stage: number): Date | null {
    const intervals = this.reviewIntervals();
    if (stage >= intervals.length) return null;
    return new Date(Date.now() + intervals[stage] * 86400000);
  }

  private async assertCanOperate(userId: string, item: Row): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    const isSelf = me?.role === 'student' && userId === item.studentUserId;
    const isStaff = me?.role === 'teacher' || me?.role === 'admin';
    if (!isSelf && !isStaff) {
      throw new ForbiddenException('无权操作该错题');
    }
  }

  /** 完成一轮复习：阶段推进并重排；到顶标记 mastered（不再提醒） */
  async reviewDone(id: string, userId: string): Promise<void> {
    const rows: Row[] = await this.db
      .select()
      .from(wrongQuestion)
      .where(eq(wrongQuestion.id, id))
      .limit(1);
    if (rows.length === 0) throw new ForbiddenException('错题不存在');
    const item = rows[0];
    await this.assertCanOperate(userId, item);
    const nextStage = (item.reviewStage ?? 0) + 1;
    const next = this.nextReviewDate(nextStage);
    await this.db
      .update(wrongQuestion)
      .set({
        reviewStage: nextStage,
        reviewCount: (item.reviewCount ?? 0) + 1,
        lastReviewAt: new Date(),
        nextReviewAt: next,
        status: next ? 'corrected' : 'mastered',
        reviewTaskId: null,
      })
      .where(eq(wrongQuestion.id, id));
  }

  /** 跳过本轮复习：顺延一个间隔（不推进阶段） */
  async reviewSkip(id: string, userId: string): Promise<void> {
    const rows: Row[] = await this.db
      .select()
      .from(wrongQuestion)
      .where(eq(wrongQuestion.id, id))
      .limit(1);
    if (rows.length === 0) throw new ForbiddenException('错题不存在');
    const item = rows[0];
    await this.assertCanOperate(userId, item);
    const next = this.nextReviewDate(Math.max(1, item.reviewStage ?? 0));
    await this.db
      .update(wrongQuestion)
      .set({ nextReviewAt: next, reviewTaskId: null })
      .where(eq(wrongQuestion.id, id));
  }

  /** 复习计划：已排期且未掌握的错题 */
  async reviewPlan(userId: string, studentUserId?: string): Promise<Row[]> {
    let target = studentUserId ?? '';
    if (!target) {
      const me = await this.accountService.findProfile(userId);
      if (me?.role === 'parent') {
        const meData = await this.accountService.getMe(userId);
        target = meData.children[0]?.userId ?? '';
      }
    }
    if (!target) target = userId;
    await this.assertCanView(userId, target);
    return this.db
      .select()
      .from(wrongQuestion)
      .where(
        and(
          eq(wrongQuestion.studentUserId, target),
          sql`${wrongQuestion.nextReviewAt} IS NOT NULL`,
        ),
      )
      .orderBy(wrongQuestion.nextReviewAt);
  }

  /**
   * 到期扫描（定时任务调用）：今天需要复习的错题。
   * 防骚扰：只扫 next_review_at 到今天为止、且没有等待中复习任务的。
   */
  async dueReviews(): Promise<Row[]> {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.db
      .select()
      .from(wrongQuestion)
      .where(
        and(
          sql`${wrongQuestion.nextReviewAt} IS NOT NULL`,
          lte(wrongQuestion.nextReviewAt, endOfDay),
          sql`${wrongQuestion.reviewTaskId} IS NULL`,
        ),
      )
      .orderBy(wrongQuestion.nextReviewAt)
      .limit(200);
  }

  /** 标记复习任务已创建（防重复提醒） */
  async markReviewTaskCreated(id: string, taskId: string): Promise<void> {
    await this.db
      .update(wrongQuestion)
      .set({ reviewTaskId: taskId })
      .where(eq(wrongQuestion.id, id));
  }
}
