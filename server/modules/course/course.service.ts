import { BadRequestException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  appProfile,
  course,
  guardianLink,
  lessonAccount,
  lessonLedger,
} from '@server/database/schema';
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import type {
  CourseDTO,
  CourseStatus,
  CourseWeekResponse,
  CreateCourseRequest,
  GrantLessonRequest,
  LessonLedgerDTO,
  LessonSummaryResponse,
  RelatedUserDTO,
  UserRole,
} from '@shared/api.interface';
import { weekRange } from '@server/common/date.util';
import { AccountService } from '../account/account.service';
import { MessageService } from '../message/message.service';

type CourseRow = typeof course.$inferSelect;
type AccountRow = typeof lessonAccount.$inferSelect;

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
    private readonly messageService: MessageService,
  ) {}

  private async visibleStudentIds(userId: string): Promise<string[]> {
    const me = await this.accountService.findProfile(userId);
    if (!me) return [];
    const role: UserRole = me.role;
    if (role === 'student') return [userId];
    if (role === 'parent') {
      const links = await this.db
        .select()
        .from(guardianLink)
        .where(eq(guardianLink.parentUserId, userId));
      return links.map((link) => link.studentUserId);
    }
    if (role === 'teacher') {
      return [];
    }
    const rows = await this.db
      .select({ userId: appProfile.userId })
      .from(appProfile)
      .where(eq(appProfile.role, 'student'));
    return rows.map((row) => row.userId);
  }

  private async guardianIdsOf(studentUserId: string): Promise<string[]> {
    const links = await this.db
      .select()
      .from(guardianLink)
      .where(eq(guardianLink.studentUserId, studentUserId));
    return links.map((link) => link.parentUserId);
  }

  async listWeek(
    userId: string,
    weekStartInput?: string,
  ): Promise<CourseWeekResponse> {
    const base = weekStartInput ? new Date(weekStartInput) : new Date();
    const { weekStart, weekEnd } = weekRange(base);
    const me = await this.accountService.findProfile(userId);
    const studentIds = await this.visibleStudentIds(userId);

    const rows: CourseRow[] =
      me?.role === 'teacher'
        ? await this.db
            .select()
            .from(course)
            .where(
              and(
                eq(course.teacherUserId, userId),
                gte(course.startAt, weekStart),
                lte(course.startAt, weekEnd),
              ),
            )
            .orderBy(asc(course.startAt))
        : me?.role === 'admin'
          ? await this.db
              .select()
              .from(course)
              .where(
                and(gte(course.startAt, weekStart), lte(course.startAt, weekEnd)),
              )
              .orderBy(asc(course.startAt))
              .limit(200)
          : await this.db
              .select()
              .from(course)
              .where(
                and(
                  studentIds.length > 0
                    ? inArray(course.studentUserId, studentIds)
                    : eq(course.studentUserId, '__none__'),
                  gte(course.startAt, weekStart),
                  lte(course.startAt, weekEnd),
                ),
              )
              .orderBy(asc(course.startAt));

    const profileMap = await this.accountService.getProfileMap([
      ...rows.map((row: CourseRow) => row.studentUserId),
      ...rows.map((row: CourseRow) => row.teacherUserId ?? ''),
    ]);

    const items: CourseDTO[] = rows.map((row: CourseRow) => {
      const student: RelatedUserDTO | undefined = profileMap.get(
        row.studentUserId,
      );
      const teacher: RelatedUserDTO | undefined = profileMap.get(
        row.teacherUserId ?? '',
      );
      return {
        id: row.id,
        studentUserId: row.studentUserId,
        studentName: student?.name ?? '未命名学生',
        teacherUserId: row.teacherUserId ?? '',
        teacherName: teacher?.name ?? '待安排',
        subject: row.subject,
        startAt: row.startAt.toISOString(),
        endAt: row.endAt.toISOString(),
        location: row.location ?? '',
        status: row.status as CourseStatus,
        lessonCount: row.lessonCount,
        remark: row.remark ?? '',
      };
    });

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      items,
    };
  }

  async create(
    dto: CreateCourseRequest,
    userId: string,
  ): Promise<CourseDTO> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以排课');
    }
    const teacherId = dto.teacherUserId || (me.role === 'teacher' ? userId : '');
    if (me.role === 'teacher') {
      const allowed = await this.accountService.canTeachStudent(
        userId,
        dto.studentUserId,
      );
      if (!allowed) {
        throw new ForbiddenException('该学生不在你的带班范围内');
      }
    }
    const inserted: CourseRow[] = await this.db
      .insert(course)
      .values({
        studentUserId: dto.studentUserId,
        teacherUserId: teacherId || null,
        subject: dto.subject,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        location: dto.location ?? null,
        lessonCount: dto.lessonCount ?? 1,
        remark: dto.remark ?? null,
      })
      .returning();
    const row = inserted[0];

    const notified = [dto.studentUserId, ...(await this.guardianIdsOf(dto.studentUserId))];
    for (const targetId of notified) {
      await this.messageService.notify({
        userId: targetId,
        msgType: 'course',
        title: '新增课程安排',
        content: `${dto.subject} 课程已安排在 ${new Date(dto.startAt).toLocaleString('zh-CN')}`,
        linkPath: '/schedule',
      });
    }

    return {
      id: row.id,
      studentUserId: row.studentUserId,
      studentName: '',
      teacherUserId: row.teacherUserId ?? '',
      teacherName: '',
      subject: row.subject,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      location: row.location ?? '',
      status: row.status as CourseStatus,
      lessonCount: row.lessonCount,
      remark: row.remark ?? '',
    };
  }

  async updateStatus(
    courseId: string,
    status: CourseStatus,
    userId: string,
    remark?: string,
  ): Promise<CourseDTO> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以变更课程状态');
    }
    const current: CourseRow[] = await this.db
      .select()
      .from(course)
      .where(eq(course.id, courseId))
      .limit(1);
    if (current.length === 0) {
      throw new ForbiddenException('课程不存在');
    }
    if (me.role === 'teacher') {
      const isOwner = current[0].teacherUserId === userId;
      const isMine = isOwner
        ? true
        : await this.accountService.canTeachStudent(
            userId,
            current[0].studentUserId,
          );
      if (!isMine) {
        throw new ForbiddenException('只能变更自己授课课程的状态');
      }
    }
    const updated: CourseRow[] = await this.db
      .update(course)
      .set({
        status,
        remark: remark ?? undefined,
      })
      .where(eq(course.id, courseId))
      .returning();
    if (updated.length === 0) {
      throw new ForbiddenException('课程不存在');
    }
    const row = updated[0];
    return {
      id: row.id,
      studentUserId: row.studentUserId,
      studentName: '',
      teacherUserId: row.teacherUserId ?? '',
      teacherName: '',
      subject: row.subject,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      location: row.location ?? '',
      status: row.status as CourseStatus,
      lessonCount: row.lessonCount,
      remark: row.remark ?? '',
    };
  }

  async consume(courseId: string, userId: string): Promise<{
    remaining: number;
    subject: string;
  }> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以消课');
    }
    const rows: CourseRow[] = await this.db
      .select()
      .from(course)
      .where(eq(course.id, courseId))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('课程不存在');
    }
    const target = rows[0];
    if (me.role === 'teacher') {
      const isOwner = target.teacherUserId === userId;
      const isMine = isOwner
        ? true
        : await this.accountService.canTeachStudent(
            userId,
            target.studentUserId,
          );
      if (!isMine) {
        throw new ForbiddenException('只能对自己授课的课程消课');
      }
    }
    const amount = target.lessonCount || 1;

    // 事务：改课程状态 + 扣课时 + 写流水，要么全成功要么全回滚
    const remaining = await this.db.transaction(async (tx) => {
      if (target.status !== 'done') {
        await tx
          .update(course)
          .set({ status: 'done' })
          .where(eq(course.id, courseId));
      }

      const existing: AccountRow[] = await tx
        .select()
        .from(lessonAccount)
        .where(
          and(
            eq(lessonAccount.studentUserId, target.studentUserId),
            eq(lessonAccount.subject, target.subject),
          ),
        )
        .limit(1);

      let left = 0;
      if (existing.length === 0) {
        const created: AccountRow[] = await tx
          .insert(lessonAccount)
          .values({
            studentUserId: target.studentUserId,
            subject: target.subject,
            totalLessons: 0,
            usedLessons: amount,
          })
          .returning();
        left = created[0].totalLessons - created[0].usedLessons;
      } else {
        const account = existing[0];
        const updated: AccountRow[] = await tx
          .update(lessonAccount)
          .set({ usedLessons: account.usedLessons + amount })
          .where(eq(lessonAccount.id, account.id))
          .returning();
        left = updated[0].totalLessons - updated[0].usedLessons;
      }

      await tx.insert(lessonLedger).values({
        studentUserId: target.studentUserId,
        subject: target.subject,
        changeAmount: -amount,
        changeType: 'consume',
        courseId: target.id,
        operatorUserId: userId,
        remark: `${target.subject} 课程消课`,
      });

      return left;
    });

    const notified = [
      target.studentUserId,
      ...(await this.guardianIdsOf(target.studentUserId)),
    ];
    for (const targetId of notified) {
      await this.messageService.notify({
        userId: targetId,
        msgType: 'lesson',
        title: '课时已消耗，请确认',
        content: `${target.subject} 本次消耗 ${amount} 课时，剩余 ${remaining} 课时，请核对后确认`,
        linkPath: '/lessons',
      });
    }

    return { remaining, subject: target.subject };
  }

  /** 家长/学生确认某笔消课（双向确认，避免糊涂扣费） */
  async confirmLedger(ledgerId: string, userId: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(lessonLedger)
      .where(eq(lessonLedger.id, ledgerId))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('流水记录不存在');
    }
    const ledger = rows[0];
    if (ledger.changeType !== 'consume') {
      throw new BadRequestException('只有消课记录需要确认');
    }
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    const isSelf = me.role === 'student' && userId === ledger.studentUserId;
    const isParent =
      me.role === 'parent' &&
      (await this.accountService.canViewStudent(userId, ledger.studentUserId));
    if (!isSelf && !isParent) {
      throw new ForbiddenException('只能确认本人或本人孩子的消课记录');
    }
    await this.db
      .update(lessonLedger)
      .set({ confirmedAt: new Date(), confirmedBy: userId })
      .where(eq(lessonLedger.id, ledgerId));
  }

  async lessonSummary(studentUserId: string): Promise<LessonSummaryResponse> {
    const accounts: AccountRow[] = await this.db
      .select()
      .from(lessonAccount)
      .where(eq(lessonAccount.studentUserId, studentUserId))
      .orderBy(asc(lessonAccount.subject));
    const ledgers = await this.db
      .select()
      .from(lessonLedger)
      .where(eq(lessonLedger.studentUserId, studentUserId))
      .orderBy(desc(lessonLedger.createdAt))
      .limit(30);
    const ledgerItems: LessonLedgerDTO[] = ledgers.map((row) => ({
      id: row.id,
      subject: row.subject,
      changeAmount: row.changeAmount,
      changeType: row.changeType as 'purchase' | 'consume' | 'adjust',
      remark: row.remark ?? '',
      createdAt: row.createdAt.toISOString(),
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    }));
    return {
      accounts: accounts.map((row: AccountRow) => ({
        subject: row.subject,
        totalLessons: row.totalLessons,
        usedLessons: row.usedLessons,
        remaining: row.totalLessons - row.usedLessons,
        alertThreshold: row.alertThreshold,
      })),
      ledgers: ledgerItems,
    };
  }

  async grant(dto: GrantLessonRequest, userId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me || me.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以发放课时');
    }
    const amount = Math.trunc(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('发放课时必须是大于 0 的整数');
    }
    if (amount > 999) {
      throw new BadRequestException('单次发放课时不能超过 999');
    }
    const existing: AccountRow[] = await this.db
      .select()
      .from(lessonAccount)
      .where(
        and(
          eq(lessonAccount.studentUserId, dto.studentUserId),
          eq(lessonAccount.subject, dto.subject),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await this.db.insert(lessonAccount).values({
        studentUserId: dto.studentUserId,
        subject: dto.subject,
        totalLessons: amount,
        usedLessons: 0,
      });
    } else {
      const account = existing[0];
      await this.db
        .update(lessonAccount)
        .set({ totalLessons: account.totalLessons + amount })
        .where(eq(lessonAccount.id, account.id));
    }
    await this.db.insert(lessonLedger).values({
      studentUserId: dto.studentUserId,
      subject: dto.subject,
      changeAmount: amount,
      changeType: 'purchase',
      operatorUserId: userId,
      remark: dto.remark ?? '后台发放课时',
    });

    const notified = [
      dto.studentUserId,
      ...(await this.guardianIdsOf(dto.studentUserId)),
    ];
    for (const targetId of notified) {
      await this.messageService.notify({
        userId: targetId,
        msgType: 'lesson',
        title: '课时已发放',
        content: `${dto.subject} 新增 ${amount} 课时`,
        linkPath: '/lessons',
      });
    }
  }
}
