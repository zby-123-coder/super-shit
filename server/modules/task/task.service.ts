import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  guardianLink,
  studyTask,
  taskCheckin,
  teachingLink,
} from '@server/database/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import type {
  CheckinDTO,
  CreateCheckinRequest,
  CreateTaskRequest,
  ReviewCheckinRequest,
  TaskDTO,
  TaskListResponse,
} from '@shared/api.interface';
import { businessDayKey } from '@server/common/date.util';
import { AccountService } from '../account/account.service';
import { MessageService } from '../message/message.service';

type TaskRow = typeof studyTask.$inferSelect;
type CheckinRow = typeof taskCheckin.$inferSelect;

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
    private readonly messageService: MessageService,
  ) {}

  private async childrenOf(parentId: string): Promise<string[]> {
    const links = await this.db
      .select()
      .from(guardianLink)
      .where(eq(guardianLink.parentUserId, parentId));
    return links.map((link) => link.studentUserId);
  }

  private async studentsOf(teacherId: string): Promise<string[]> {
    const links = await this.db
      .select()
      .from(teachingLink)
      .where(eq(teachingLink.teacherUserId, teacherId));
    return links.map((link) => link.studentUserId);
  }

  private toCheckinDTO(
    row: CheckinRow,
    nameMap: Map<string, string>,
  ): CheckinDTO {
    return {
      id: row.id,
      taskId: row.taskId,
      studentUserId: row.studentUserId,
      studentName: nameMap.get(row.studentUserId) ?? '学生',
      content: row.content ?? '',
      imageUrls: row.imageUrls ?? [],
      durationMin: row.durationMin ?? 0,
      status: row.status as CheckinDTO['status'],
      reviewComment: row.reviewComment ?? '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async streakOf(studentUserId: string): Promise<number> {
    const rows = await this.db
      .select({ createdAt: taskCheckin.createdAt })
      .from(taskCheckin)
      .where(eq(taskCheckin.studentUserId, studentUserId))
      .orderBy(desc(taskCheckin.createdAt))
      .limit(200);
    if (rows.length === 0) return 0;
    const days = new Set<string>(
      rows.map((row) => businessDayKey(row.createdAt)),
    );
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i += 1) {
      const key = businessDayKey(cursor);
      if (days.has(key)) {
        streak += 1;
      } else if (i > 0) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  async list(userId: string): Promise<TaskListResponse> {
    const me = await this.accountService.getMe(userId);
    if (!me.profile) {
      return { items: [], pendingCount: 0, doneCount: 0, streakDays: 0 };
    }
    const role = me.profile.role;
    let rows: TaskRow[] = [];
    if (role === 'student') {
      rows = await this.db
        .select()
        .from(studyTask)
        .where(eq(studyTask.studentUserId, userId))
        .orderBy(desc(studyTask.createdAt))
        .limit(100);
    } else if (role === 'teacher') {
      rows = await this.db
        .select()
        .from(studyTask)
        .where(eq(studyTask.teacherUserId, userId))
        .orderBy(desc(studyTask.createdAt))
        .limit(100);
    } else if (role === 'parent') {
      const children = me.children.map((child) => child.userId);
      rows =
        children.length > 0
          ? await this.db
              .select()
              .from(studyTask)
              .where(inArray(studyTask.studentUserId, children))
              .orderBy(desc(studyTask.createdAt))
              .limit(100)
          : [];
    } else {
      rows = await this.db
        .select()
        .from(studyTask)
        .orderBy(desc(studyTask.createdAt))
        .limit(100);
    }

    const taskIds = rows.map((row: TaskRow) => row.id);
    const checkinMap = new Map<string, CheckinRow>();
    if (taskIds.length > 0) {
      const checkins: CheckinRow[] = await this.db
        .select()
        .from(taskCheckin)
        .where(inArray(taskCheckin.taskId, taskIds))
        .orderBy(desc(taskCheckin.createdAt));
      checkins.forEach((row: CheckinRow) => {
        if (!checkinMap.has(row.taskId)) {
          checkinMap.set(row.taskId, row);
        }
      });
    }

    const nameIds = [
      ...rows.map((row: TaskRow) => row.studentUserId),
      ...rows.map((row: TaskRow) => row.teacherUserId),
    ];
    const profileMap = await this.accountService.getProfileMap(nameIds);
    const nameOf = (id: string): string =>
      profileMap.get(id)?.name ?? '未命名';

    const items: TaskDTO[] = rows.map((row: TaskRow) => {
      const checkin = checkinMap.get(row.id);
      return {
        id: row.id,
        teacherUserId: row.teacherUserId,
        teacherName: nameOf(row.teacherUserId),
        studentUserId: row.studentUserId,
        studentName: nameOf(row.studentUserId),
        subject: row.subject ?? '',
        title: row.title,
        content: row.content ?? '',
        dueAt: row.dueAt ? row.dueAt.toISOString() : '',
        status: row.status as TaskDTO['status'],
        checkin: checkin ? this.toCheckinDTO(checkin, new Map(
          profileMap.size > 0
            ? Array.from(profileMap.entries()).map(
                ([key, value]) => [key, value.name] as [string, string],
              )
            : [],
        )) : null,
        createdAt: row.createdAt.toISOString(),
      };
    });

    const pendingCount =
      role === 'teacher'
        ? items.filter((item) => item.status === 'submitted').length
        : items.filter((item) => item.status === 'open').length;
    const doneCount = items.filter((item) => item.status === 'approved').length;
    const streakDays =
      role === 'student' ? await this.streakOf(userId) : 0;

    return { items, pendingCount, doneCount, streakDays };
  }

  async create(dto: CreateTaskRequest, userId: string): Promise<TaskDTO> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以布置任务');
    }
    if (me.role === 'teacher') {
      const allowed = await this.accountService.canTeachStudent(
        userId,
        dto.studentUserId,
      );
      if (!allowed) {
        throw new ForbiddenException('该学生不在你的带班范围内');
      }
    }
    const inserted: TaskRow[] = await this.db
      .insert(studyTask)
      .values({
        teacherUserId: userId,
        studentUserId: dto.studentUserId,
        subject: dto.subject ?? null,
        title: dto.title,
        content: dto.content ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: 'open',
      })
      .returning();
    const row = inserted[0];

    const parents = await this.guardiansOf(dto.studentUserId);
    for (const targetId of [dto.studentUserId, ...parents]) {
      await this.messageService.notify({
        userId: targetId,
        msgType: 'task',
        title: '新的学习任务',
        content: `${me.name || '老师'}布置了任务：${dto.title}`,
        linkPath: '/tasks',
      });
    }

    return {
      id: row.id,
      teacherUserId: row.teacherUserId,
      teacherName: me.name,
      studentUserId: row.studentUserId,
      studentName: '',
      subject: row.subject ?? '',
      title: row.title,
      content: row.content ?? '',
      dueAt: row.dueAt ? row.dueAt.toISOString() : '',
      status: 'open',
      checkin: null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async checkin(
    taskId: string,
    dto: CreateCheckinRequest,
    userId: string,
  ): Promise<CheckinDTO> {
    const rows: TaskRow[] = await this.db
      .select()
      .from(studyTask)
      .where(eq(studyTask.id, taskId))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('任务不存在');
    }
    const task = rows[0];
    if (task.studentUserId !== userId) {
      throw new ForbiddenException('只能提交自己的任务打卡');
    }
    const inserted: CheckinRow[] = await this.db
      .insert(taskCheckin)
      .values({
        taskId,
        studentUserId: userId,
        content: dto.content ?? null,
        imageUrls: dto.imageUrls ?? [],
        durationMin: dto.durationMin ?? null,
        status: 'submitted',
      })
      .returning();
    await this.db
      .update(studyTask)
      .set({ status: 'submitted' })
      .where(eq(studyTask.id, taskId));

    await this.messageService.notify({
      userId: task.teacherUserId,
      msgType: 'task',
      title: '学生已提交打卡',
      content: `任务「${task.title}」已提交，待批阅`,
      linkPath: '/teacher',
    });

    const profileMap = await this.accountService.getProfileMap([userId]);
    return this.toCheckinDTO(
      inserted[0],
      new Map([[userId, profileMap.get(userId)?.name ?? '学生']]),
    );
  }

  async review(
    checkinId: string,
    dto: ReviewCheckinRequest,
    userId: string,
  ): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以批阅');
    }
    const rows: CheckinRow[] = await this.db
      .select()
      .from(taskCheckin)
      .where(eq(taskCheckin.id, checkinId))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('打卡记录不存在');
    }
    const checkin = rows[0];
    const taskRows0: TaskRow[] = await this.db
      .select()
      .from(studyTask)
      .where(eq(studyTask.id, checkin.taskId))
      .limit(1);
    if (me.role === 'teacher' && taskRows0.length > 0) {
      const isOwner = taskRows0[0].teacherUserId === userId;
      const isMine = isOwner
        ? true
        : await this.accountService.canTeachStudent(
            userId,
            taskRows0[0].studentUserId,
          );
      if (!isMine) {
        throw new ForbiddenException('只能批阅自己布置的任务');
      }
    }
    await this.db
      .update(taskCheckin)
      .set({
        status: dto.status,
        reviewComment: dto.comment ?? null,
        reviewedByUserId: userId,
      })
      .where(eq(taskCheckin.id, checkinId));
    await this.db
      .update(studyTask)
      .set({ status: dto.status })
      .where(eq(studyTask.id, checkin.taskId));

    const taskRows: TaskRow[] = await this.db
      .select()
      .from(studyTask)
      .where(eq(studyTask.id, checkin.taskId))
      .limit(1);
    const title = taskRows.length > 0 ? taskRows[0].title : '学习任务';
    const parents = await this.guardiansOf(checkin.studentUserId);
    for (const targetId of [checkin.studentUserId, ...parents]) {
      await this.messageService.notify({
        userId: targetId,
        msgType: 'task',
        title: dto.status === 'approved' ? '打卡已通过' : '打卡被退回',
        content: `任务「${title}」${dto.status === 'approved' ? '已通过' : '需要重做'}：${dto.comment ?? ''}`,
        linkPath: '/tasks',
      });
    }
  }

  private async guardiansOf(studentUserId: string): Promise<string[]> {
    const links = await this.db
      .select()
      .from(guardianLink)
      .where(eq(guardianLink.studentUserId, studentUserId));
    return links.map((link) => link.parentUserId);
  }

  async pendingReviews(userId: string): Promise<TaskDTO[]> {
    const response = await this.list(userId);
    return response.items.filter((item) => item.status === 'submitted');
  }
}
