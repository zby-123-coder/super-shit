import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  appProfile,
  authCredential,
  family,
  teachingLink,
} from '@server/database/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'node:crypto';
import type {
  AccountMeResponse,
  AppProfileDTO,
  CreateChildRequest,
  FamilyDTO,
  RelatedUserDTO,
  SaveProfileRequest,
  UserRole,
} from '@shared/api.interface';

type ProfileRow = typeof appProfile.$inferSelect;
type FamilyRow = typeof family.$inferSelect;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }

  private async familyNameOf(
    familyId: string | null,
  ): Promise<string | null> {
    if (!familyId) return null;
    const rows: FamilyRow[] = await this.db
      .select()
      .from(family)
      .where(eq(family.id, familyId))
      .limit(1);
    return rows.length > 0 ? rows[0].name : null;
  }

  private toDTO(row: ProfileRow, familyName: string | null): AppProfileDTO {
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
      familyId: row.familyId ?? null,
      familyName,
    };
  }

  async findProfile(userId: string): Promise<AppProfileDTO | null> {
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, userId))
      .limit(1);
    if (rows.length === 0) return null;
    return this.toDTO(rows[0], await this.familyNameOf(rows[0].familyId));
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

  /** 家庭详情：家长与孩子成员都来自同一家庭 */
  async getFamily(userId: string): Promise<FamilyDTO | null> {
    const me = await this.findProfile(userId);
    if (!me?.familyId) return null;
    const rows: FamilyRow[] = await this.db
      .select()
      .from(family)
      .where(eq(family.id, me.familyId))
      .limit(1);
    if (rows.length === 0) return null;
    const members: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.familyId, me.familyId));
    const toRelated = (row: ProfileRow): RelatedUserDTO => ({
      userId: row.userId,
      name: row.name ?? row.userId,
      grade: row.grade ?? '',
      role: row.role as UserRole,
    });
    return {
      id: rows[0].id,
      name: rows[0].name,
      inviteCode: rows[0].inviteCode,
      ownerUserId: rows[0].ownerUserId,
      parents: members
        .filter((row) => row.role === 'parent')
        .map((row) => toRelated(row)),
      students: members
        .filter((row) => row.role === 'student')
        .map((row) => toRelated(row)),
    };
  }

  async getMe(userId: string): Promise<AccountMeResponse> {
    const profile = await this.findProfile(userId);
    if (!profile) {
      return {
        profile: null,
        children: [],
        students: [],
        guardians: [],
        family: null,
      };
    }
    const familyData = await this.getFamily(userId);
    const children: RelatedUserDTO[] = familyData?.students ?? [];
    const guardians: RelatedUserDTO[] = familyData?.parents ?? [];

    let students: RelatedUserDTO[] = [];
    if (profile.role === 'teacher') {
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
    } else if (profile.role === 'admin') {
      const rows: ProfileRow[] = await this.db
        .select()
        .from(appProfile)
        .where(eq(appProfile.role, 'student'));
      students = rows.map((row: ProfileRow) => ({
        userId: row.userId,
        name: row.name ?? row.userId,
        grade: row.grade ?? '',
        role: 'student',
      }));
    }

    return { profile, children, students, guardians, family: familyData };
  }

  /** 老师凭学生邀请码建立带班关系（师生关系，与家庭模型互不干扰） */
  async addStudentByCode(
    teacherUserId: string,
    code: string,
  ): Promise<AppProfileDTO> {
    const me = await this.findProfile(teacherUserId);
    if (!me || me.role !== 'teacher') {
      throw new ConflictException('只有老师可以添加学生');
    }
    const rows: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.inviteCode, code.trim().toUpperCase()))
      .limit(1);
    if (rows.length === 0) {
      throw new ConflictException('邀请码不存在，请与学生确认');
    }
    const student = rows[0];
    if (student.role !== 'student') {
      throw new ConflictException('该邀请码不是学生');
    }
    const existing = await this.db
      .select()
      .from(teachingLink)
      .where(
        and(
          eq(teachingLink.teacherUserId, teacherUserId),
          eq(teachingLink.studentUserId, student.userId),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      await this.db.insert(teachingLink).values({
        teacherUserId: teacherUserId,
        studentUserId: student.userId,
      });
    }
    return this.toDTO(student, await this.familyNameOf(student.familyId));
  }

  /** 户主在家庭内直接创建孩子账号（孩子无需邀请码，也不存在跨家庭绑定） */
  async createChild(
    userId: string,
    payload: CreateChildRequest,
  ): Promise<AppProfileDTO> {
    const me = await this.findProfile(userId);
    if (!me || me.role !== 'parent') {
      throw new ConflictException('只有家长可以创建孩子账号');
    }
    if (!me.familyId) {
      throw new ConflictException('当前家庭信息异常');
    }
    const familyRows: FamilyRow[] = await this.db
      .select()
      .from(family)
      .where(eq(family.id, me.familyId))
      .limit(1);
    if (familyRows.length === 0 || familyRows[0].ownerUserId !== userId) {
      throw new ConflictException('只有户主可以创建孩子账号');
    }
    const loginName = payload.loginName.trim();
    if (loginName.length < 4) {
      throw new ConflictException('孩子登录名至少 4 位');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new ConflictException('初始密码至少 6 位');
    }
    const exists = await this.db
      .select()
      .from(authCredential)
      .where(eq(authCredential.loginName, loginName))
      .limit(1);
    if (exists.length > 0) {
      throw new ConflictException('该登录名已被使用');
    }

    const childId = `u_${randomBytes(8).toString('hex')}`;
    const inviteCode = this.generateInviteCode();
    await this.db.insert(appProfile).values({
      userId: childId,
      role: 'student',
      name: payload.name.trim(),
      grade: payload.grade ?? null,
      inviteCode,
      familyId: me.familyId,
    });
    await this.db.insert(authCredential).values({
      userId: childId,
      loginName,
      passwordHash: hashPassword(payload.password),
    });
    const created: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, childId))
      .limit(1);
    return this.toDTO(created[0], familyRows[0].name);
  }

  /** 老师是否带该学生（越权防护统一入口） */
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

  /** 家长是否可查看该学生：必须同一家庭 */
  async canViewStudent(
    parentUserId: string,
    studentUserId: string,
  ): Promise<boolean> {
    const parent: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, parentUserId))
      .limit(1);
    if (parent.length === 0 || !parent[0].familyId) return false;
    const student: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, studentUserId))
      .limit(1);
    if (student.length === 0 || student[0].role !== 'student') return false;
    return student[0].familyId === parent[0].familyId;
  }

  /** 通知对象：该学生的同家庭家长 */
  async guardianIdsOf(studentUserId: string): Promise<string[]> {
    const student: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, studentUserId))
      .limit(1);
    if (student.length === 0 || !student[0].familyId) return [];
    const members: ProfileRow[] = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.familyId, student[0].familyId));
    return members
      .filter((row) => row.role === 'parent' && row.userId !== studentUserId)
      .map((row) => row.userId);
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
      return this.toDTO(
        updated[0],
        await this.familyNameOf(updated[0].familyId),
      );
    }

    throw new ConflictException('账号档案不存在，请先注册');
  }
}
