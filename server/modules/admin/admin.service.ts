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
