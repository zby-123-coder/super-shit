import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import {
  appProfile,
  article,
  course,
  guardianLink,
  lessonLedger,
  taskCheckin,
  teachingLink,
} from '@server/database/schema';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type {
  AdminOverview,
  AdminUserDTO,
  AdminUserListResponse,
  AssignRelationRequest,
  UpdateAdminUserRequest,
  UserRole,
} from '@shared/api.interface';
import { weekRange } from '@server/common/date.util';
import { AccountService } from '../account/account.service';

type ProfileRow = typeof appProfile.$inferSelect;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
  ) {}

  private async assertAdmin(userId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me || me.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以使用后台管理能力');
    }
  }

  async overview(userId: string): Promise<AdminOverview> {
    await this.assertAdmin(userId);
    const { weekStart, weekEnd } = weekRange();

    const totalRows = await this.db
      .select({ value: count() })
      .from(appProfile);
    const studentRows = await this.db
      .select({ value: count() })
      .from(appProfile)
      .where(eq(appProfile.role, 'student'));
    const teacherRows = await this.db
      .select({ value: count() })
      .from(appProfile)
      .where(eq(appProfile.role, 'teacher'));
    const parentRows = await this.db
      .select({ value: count() })
      .from(appProfile)
      .where(eq(appProfile.role, 'parent'));
    const courseRows = await this.db
      .select({ value: count() })
      .from(course)
      .where(and(gte(course.startAt, weekStart), lte(course.startAt, weekEnd)));
    const checkinRows = await this.db
      .select({ value: count() })
      .from(taskCheckin)
      .where(eq(taskCheckin.status, 'submitted'));
    const articleRows = await this.db
      .select({ value: count() })
      .from(article)
      .where(eq(article.status, 'published'));
    const ledgerRows = await this.db
      .select({
        value: sql<string>`coalesce(sum(abs(${lessonLedger.changeAmount})), 0)`,
      })
      .from(lessonLedger)
      .where(eq(lessonLedger.changeType, 'consume'));

    return {
      userCount: totalRows[0]?.value ?? 0,
      studentCount: studentRows[0]?.value ?? 0,
      teacherCount: teacherRows[0]?.value ?? 0,
      parentCount: parentRows[0]?.value ?? 0,
      weekCourseCount: courseRows[0]?.value ?? 0,
      pendingCheckinCount: checkinRows[0]?.value ?? 0,
      articleCount: articleRows[0]?.value ?? 0,
      consumedLessons: Number(ledgerRows[0]?.value ?? 0),
    };
  }

  /** CSV 转义：含逗号/引号/换行的字段包双引号，内部引号翻倍 */
  private csvCell(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private toCsv(headers: string[], rows: unknown[][]): string {
    const lines = [headers.map((h) => this.csvCell(h)).join(',')];
    for (const row of rows) {
      lines.push(row.map((cell) => this.csvCell(cell)).join(','));
    }
    // BOM 头保证 Excel 打开中文不乱码
    return `\ufeff${lines.join('\r\n')}`;
  }

  /** 导出用户 CSV */
  async exportUsers(): Promise<string> {
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .orderBy(desc(appProfile.createdAt));
    return this.toCsv(
      ['用户ID', '姓名', '角色', '手机号', '年级', '科目', '邀请码', '注册时间'],
      rows.map((row) => [
        row.userId,
        row.name ?? '',
        row.role,
        row.phone ?? '',
        row.grade ?? '',
        row.subjectTags ?? '',
        row.inviteCode ?? '',
        row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '',
      ]),
    );
  }

  /** 导出发放/消课流水 CSV */
  async exportLedgers(): Promise<string> {
    const rows = await this.db
      .select({
        studentName: appProfile.name,
        subject: lessonLedger.subject,
        changeType: lessonLedger.changeType,
        changeAmount: lessonLedger.changeAmount,
        remark: lessonLedger.remark,
        createdAt: lessonLedger.createdAt,
      })
      .from(lessonLedger)
      .leftJoin(appProfile, eq(appProfile.userId, lessonLedger.studentUserId))
      .orderBy(desc(lessonLedger.createdAt));
    return this.toCsv(
      ['学生', '科目', '类型', '数量', '备注', '时间'],
      rows.map((row) => [
        row.studentName ?? '',
        row.subject,
        row.changeType === 'grant' ? '发放' : row.changeType === 'consume' ? '消课' : '调整',
        row.changeAmount,
        row.remark ?? '',
        row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '',
      ]),
    );
  }

  async listUsers(userId: string): Promise<AdminUserListResponse> {
    await this.assertAdmin(userId);
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .orderBy(desc(appProfile.createdAt))
      .limit(200);
    return {
      items: rows.map((row: ProfileRow) => ({
        id: row.id,
        userId: row.userId,
        name: row.name ?? '未命名',
        role: row.role as UserRole,
        phone: row.phone ?? '',
        grade: row.grade ?? '',
        inviteCode: row.inviteCode ?? '',
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async updateUser(
    userId: string,
    profileId: string,
    payload: UpdateAdminUserRequest,
  ): Promise<AdminUserDTO> {
    await this.assertAdmin(userId);
    const updated: ProfileRow[] = await this.db
      .update(appProfile)
      .set({
        name: payload.name,
        role: payload.role,
        phone: payload.phone,
        grade: payload.grade,
        subjectTags: payload.subjectTags,
      })
      .where(eq(appProfile.id, profileId))
      .returning();
    if (updated.length === 0) {
      throw new ForbiddenException('用户不存在');
    }
    const row = updated[0];
    return {
      id: row.id,
      userId: row.userId,
      name: row.name ?? '',
      role: row.role as UserRole,
      phone: row.phone ?? '',
      grade: row.grade ?? '',
      inviteCode: row.inviteCode ?? '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async assign(
    userId: string,
    payload: AssignRelationRequest,
  ): Promise<{ success: boolean }> {
    await this.assertAdmin(userId);
    if (payload.teacherUserId) {
      const existing = await this.db
        .select()
        .from(teachingLink)
        .where(
          and(
            eq(teachingLink.teacherUserId, payload.teacherUserId),
            eq(teachingLink.studentUserId, payload.studentUserId),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await this.db.insert(teachingLink).values({
          teacherUserId: payload.teacherUserId,
          studentUserId: payload.studentUserId,
          subject: payload.subject ?? null,
        });
      }
    }
    if (payload.parentUserId) {
      const existing = await this.db
        .select()
        .from(guardianLink)
        .where(
          and(
            eq(guardianLink.parentUserId, payload.parentUserId),
            eq(guardianLink.studentUserId, payload.studentUserId),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await this.db.insert(guardianLink).values({
          parentUserId: payload.parentUserId,
          studentUserId: payload.studentUserId,
        });
      }
    }
    return { success: true };
  }
}
