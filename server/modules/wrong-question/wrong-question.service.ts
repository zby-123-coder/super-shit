import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import { desc, eq } from 'drizzle-orm';
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
      status: row.status as 'open' | 'corrected',
      createdAt: row.createdAt.toISOString(),
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
      .set({ status: 'corrected' })
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
}
