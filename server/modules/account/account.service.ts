import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  appProfile,
  guardianLink,
  teachingLink,
} from '@server/database/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type {
  AccountMeResponse,
  AppProfileDTO,
  BindItemDTO,
  RelatedUserDTO,
  SaveProfileRequest,
  UserRole,
} from '@shared/api.interface';

type ProfileRow = typeof appProfile.$inferSelect;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toDTO(row: ProfileRow): AppProfileDTO {
    return {
      id: row.id,
      userId: row.userId,
      role: row.role as UserRole,
      name: row.name ?? '',
      phone: row.phone ?? '',
      grade: row.grade ?? '',
      subjectTags: row.subjectTags ?? '',
      avatarUrl: row.avatarUrl ?? '',
      inviteCode: row.inviteCode ?? '',
      notifyMute: row.notifyMute ?? false,
    };
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }

  async findProfile(userId: string): Promise<AppProfileDTO | null> {
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, userId))
      .limit(1);
    if (rows.length === 0) return null;
    return this.toDTO(rows[0]);
  }

  /** 批量查询用户档案，用于把 userId 渲染成姓名 */
  async getProfileMap(
    userIds: string[],
  ): Promise<Map<string, RelatedUserDTO>> {
    const map = new Map<string, RelatedUserDTO>();
    const uniqueIds = Array.from(new Set(userIds.filter((id) => !!id)));
    if (uniqueIds.length === 0) return map;
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(inArray(appProfile.userId, uniqueIds));
    rows.forEach((row: ProfileRow) => {
      map.set(row.userId, {
        userId: row.userId,
        name: row.name ?? row.userId,
        grade: row.grade ?? '',
        role: row.role as UserRole,
      });
    });
    return map;
  }

  async getMe(userId: string): Promise<AccountMeResponse> {
    const profile = await this.findProfile(userId);
    if (!profile) {
      return { profile: null, children: [], students: [], guardians: [] };
    }
    const children: RelatedUserDTO[] = [];
    const students: RelatedUserDTO[] = [];
    const guardians: RelatedUserDTO[] = [];

    if (profile.role === 'parent') {
      const links = await this.db
        .select()
        .from(guardianLink)
        .where(eq(guardianLink.parentUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.studentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.studentUserId);
        if (item) children.push(item);
      });
    } else if (profile.role === 'student') {
      const links = await this.db
        .select()
        .from(guardianLink)
        .where(eq(guardianLink.studentUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.parentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.parentUserId);
        if (item) guardians.push(item);
      });
    } else if (profile.role === 'teacher') {
      const links = await this.db
        .select()
        .from(teachingLink)
        .where(eq(teachingLink.teacherUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.studentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.studentUserId);
        if (item) students.push(item);
      });
    } else {
      const rows: ProfileRow[] = await this.db
        .select()
        .from(appProfile)
        .where(eq(appProfile.role, 'student'));
      rows.forEach((row: ProfileRow) => {
        students.push({
          userId: row.userId,
          name: row.name ?? row.userId,
          grade: row.grade ?? '',
          role: 'student',
        });
      });
    }

    return { profile, children, students, guardians };
  }

  /** 老师是否带该学生（越权防护的统一入口） */
  async canTeachStudent(
    teacherUserId: string,
    studentUserId: string,
  ): Promise<boolean> {
    const links = await this.db
      .select()
      .from(teachingLink)
      .where(
        and(
          eq(teachingLink.teacherUserId, teacherUserId),
          eq(teachingLink.studentUserId, studentUserId),
        ),
      )
      .limit(1);
    return links.length > 0;
  }

  /** 家长是否可查看该学生 */
  async canViewStudent(
    parentUserId: string,
    studentUserId: string,
  ): Promise<boolean> {
    const links = await this.db
      .select()
      .from(guardianLink)
      .where(
        and(
          eq(guardianLink.parentUserId, parentUserId),
          eq(guardianLink.studentUserId, studentUserId),
        ),
      )
      .limit(1);
    return links.length > 0;
  }

  async saveProfile(
    userId: string,
    payload: SaveProfileRequest,
  ): Promise<AppProfileDTO> {
    const existing: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const updated: ProfileRow[] = await this.db
        .update(appProfile)
        .set({
          role: payload.role,
          name: payload.name,
          phone: payload.phone ?? existing[0].phone,
          grade: payload.grade ?? existing[0].grade,
          subjectTags: payload.subjectTags ?? existing[0].subjectTags,
          avatarUrl: payload.avatarUrl ?? existing[0].avatarUrl,
          notifyMute: payload.notifyMute ?? existing[0].notifyMute,
        })
        .where(eq(appProfile.userId, userId))
        .returning();
      return this.toDTO(updated[0]);
    }

    let inviteCode = this.generateInviteCode();
    for (let i = 0; i < 5; i += 1) {
      const conflict: ProfileRow[] = await this.db
        .select()
        .from(appProfile)
        .where(eq(appProfile.inviteCode, inviteCode))
        .limit(1);
      if (conflict.length === 0) break;
      inviteCode = this.generateInviteCode();
    }

    const inserted: ProfileRow[] = await this.db
      .insert(appProfile)
      .values({
        userId,
        role: payload.role,
        name: payload.name,
        phone: payload.phone ?? null,
        grade: payload.grade ?? null,
        subjectTags: payload.subjectTags ?? null,
        avatarUrl: payload.avatarUrl ?? null,
        inviteCode,
        notifyMute: payload.notifyMute ?? false,
      })
      .returning();
    return this.toDTO(inserted[0]);
  }

  /** 通过邀请码建立绑定关系：家长绑孩子 / 老师加学生 / 学生绑家长 */
  async bindByCode(userId: string, code: string): Promise<BindItemDTO> {
    const me = await this.findProfile(userId);
    if (!me) {
      throw new ConflictException('请先完善个人身份信息');
    }
    const targets: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.inviteCode, code.trim().toUpperCase()))
      .limit(1);
    if (targets.length === 0) {
      throw new ConflictException('邀请码不存在，请核对后重试');
    }
    const target = targets[0];
    if (target.userId === userId) {
      throw new ConflictException('不能绑定自己');
    }

    if (me.role === 'parent' && target.role === 'student') {
      return this.createGuardianLink(userId, target);
    }
    if (me.role === 'teacher' && target.role === 'student') {
      return this.createTeachingLink(userId, target);
    }
    if (me.role === 'student' && target.role === 'parent') {
      return this.createGuardianLink(target.userId, targets[0], true);
    }
    throw new ConflictException('当前身份与该邀请码不匹配，无法建立绑定');
  }

  private async createGuardianLink(
    parentId: string,
    studentRow: ProfileRow,
    reverse = false,
  ): Promise<BindItemDTO> {
    const existing = await this.db
      .select()
      .from(guardianLink)
      .where(
        and(
          eq(guardianLink.parentUserId, parentId),
          eq(guardianLink.studentUserId, studentRow.userId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('已经绑定过该学生');
    }
    await this.db.insert(guardianLink).values({
      parentUserId: parentId,
      studentUserId: studentRow.userId,
    });
    return this.toBindItem(reverse ? parentId : studentRow.userId, studentRow);
  }

  private async createTeachingLink(
    teacherId: string,
    studentRow: ProfileRow,
  ): Promise<BindItemDTO> {
    const existing = await this.db
      .select()
      .from(teachingLink)
      .where(
        and(
          eq(teachingLink.teacherUserId, teacherId),
          eq(teachingLink.studentUserId, studentRow.userId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('已经带过该学生');
    }
    await this.db.insert(teachingLink).values({
      teacherUserId: teacherId,
      studentUserId: studentRow.userId,
    });
    return this.toBindItem(studentRow.userId, studentRow);
  }

  private toBindItem(
    userId: string,
    row: ProfileRow,
  ): BindItemDTO {
    return {
      id: row.id,
      userId,
      name: row.name ?? row.userId,
      grade: row.grade ?? '',
    };
  }

  async listBindings(userId: string): Promise<{
    children: BindItemDTO[];
    students: BindItemDTO[];
    guardians: BindItemDTO[];
  }> {
    const me = await this.findProfile(userId);
    if (!me) return { children: [], students: [], guardians: [] };
    const result: {
      children: BindItemDTO[];
      students: BindItemDTO[];
      guardians: BindItemDTO[];
    } = { children: [], students: [], guardians: [] };

    if (me.role === 'parent') {
      const links = await this.db
        .select()
        .from(guardianLink)
        .where(eq(guardianLink.parentUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.studentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.studentUserId);
        if (item) {
          result.children.push({
            id: link.id,
            userId: item.userId,
            name: item.name,
            grade: item.grade,
          });
        }
      });
    } else if (me.role === 'student') {
      const links = await this.db
        .select()
        .from(guardianLink)
        .where(eq(guardianLink.studentUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.parentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.parentUserId);
        if (item) {
          result.guardians.push({
            id: link.id,
            userId: item.userId,
            name: item.name,
            grade: item.grade,
          });
        }
      });
    } else {
      const links = await this.db
        .select()
        .from(teachingLink)
        .where(eq(teachingLink.teacherUserId, userId));
      const map = await this.getProfileMap(
        links.map((link) => link.studentUserId),
      );
      links.forEach((link) => {
        const item = map.get(link.studentUserId);
        if (item) {
          result.students.push({
            id: link.id,
            userId: item.userId,
            name: item.name,
            grade: item.grade,
          });
        }
      });
    }
    return result;
  }

  async unbind(linkId: string, userId: string): Promise<void> {
    const guardianRows = await this.db
      .select()
      .from(guardianLink)
      .where(eq(guardianLink.id, linkId))
      .limit(1);
    if (guardianRows.length > 0) {
      const link = guardianRows[0];
      if (link.parentUserId !== userId && link.studentUserId !== userId) {
        throw new ConflictException('无权解除该绑定关系');
      }
      await this.db
        .delete(guardianLink)
        .where(eq(guardianLink.id, linkId));
      return;
    }
    const teachingRows = await this.db
      .select()
      .from(teachingLink)
      .where(eq(teachingLink.id, linkId))
      .limit(1);
    if (teachingRows.length > 0) {
      await this.db.delete(teachingLink).where(eq(teachingLink.id, linkId));
    }
  }
}
