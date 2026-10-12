import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  appProfile,
  article,
  course,
  lessonAccount,
  lessonLedger,
  studyProgress,
  studyTask,
  teachingLink,
} from '@server/database/schema';
import { and, eq, like } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { AccountService } from '../account/account.service';

/** 演示数据统一使用可识别的标记，便于一键清除 */
const DEMO_LOCATION = '演示数据';
const DEMO_TASK_PREFIX = '【演示】';
const DEMO_POINT = '演示数据';
const DEMO_PROFILE_NAME = '演示同学';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
  ) {}

  private newDemoUserId(): string {
    return `demo_${randomBytes(6).toString('hex')}`;
  }

  private demoInviteCode(): string {
    return `D${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  /** 给某个学生 ID 灌一套完整演示数据 */
  private async seedStudentData(studentUserId: string): Promise<void> {
    const now = new Date();
    const day = (offset: number, hour: number): Date => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    await this.db.insert(course).values([
      {
        studentUserId,
        subject: '数学',
        startAt: day(0, 18),
        endAt: day(0, 20),
        location: DEMO_LOCATION,
        status: 'pending',
        lessonCount: 1,
      },
      {
        studentUserId,
        subject: '英语',
        startAt: day(2, 10),
        endAt: day(2, 11),
        location: DEMO_LOCATION,
        status: 'pending',
        lessonCount: 1,
      },
    ]);

    await this.db.insert(studyTask).values([
      {
        teacherUserId: 'demo',
        studentUserId,
        subject: '数学',
        title: '整理本周错题并写出思路',
        content: `${DEMO_TASK_PREFIX}错题本 P46-P52，写出每题的解题思路`,
        dueAt: day(2, 20),
        status: 'open',
      },
      {
        teacherUserId: 'demo',
        studentUserId,
        subject: '语文',
        title: '背诵《岳阳楼记》第三、四段',
        content: `${DEMO_TASK_PREFIX}明早课前抽查`,
        dueAt: day(1, 20),
        status: 'open',
      },
    ]);

    await this.db.insert(lessonAccount).values({
      studentUserId,
      subject: '数学',
      totalLessons: 20,
      usedLessons: 6,
    });
    await this.db.insert(lessonLedger).values([
      {
        studentUserId,
        subject: '数学',
        changeAmount: 20,
        changeType: 'purchase',
        remark: DEMO_LOCATION,
      },
      {
        studentUserId,
        subject: '数学',
        changeAmount: -6,
        changeType: 'consume',
        remark: DEMO_LOCATION,
      },
    ]);

    await this.db.insert(studyProgress).values([
      {
        studentUserId,
        subject: '数学',
        chapter: '第 3 章 函数',
        percent: 72,
        currentPoint: DEMO_POINT,
      },
      {
        studentUserId,
        subject: '英语',
        chapter: 'Unit 4 语法',
        percent: 45,
        currentPoint: DEMO_POINT,
      },
    ]);
  }

  /** 当前用户是否已有演示数据 */
  async hasDemo(userId: string): Promise<boolean> {
    const mine = await this.db
      .select({ id: course.id })
      .from(course)
      .where(
        and(
          eq(course.studentUserId, userId),
          eq(course.location, DEMO_LOCATION),
        ),
      )
      .limit(1);
    if (mine.length > 0) return true;
    const links = await this.db
      .select({ studentUserId: teachingLink.studentUserId })
      .from(teachingLink)
      .where(eq(teachingLink.teacherUserId, userId));
    const demoLinks = links.filter((row) =>
      row.studentUserId.startsWith('demo_'),
    );
    return demoLinks.length > 0;
  }

  async seed(userId: string): Promise<{ created: number }> {
    const me = await this.accountService.findProfile(userId);
    if (!me) return { created: 0 };
    if (await this.hasDemo(userId)) return { created: 0 };

    if (me.role === 'student') {
      await this.seedStudentData(userId);
      return { created: 1 };
    }

    // 家长 / 老师 / 管理员：创建一个演示学生账号并关联
    const demoUserId = this.newDemoUserId();
    await this.db.insert(appProfile).values({
      userId: demoUserId,
      role: 'student',
      name: DEMO_PROFILE_NAME,
      grade: '初二',
      inviteCode: this.demoInviteCode(),
    });

    if (me.role === 'parent') {
      // 演示学生直接成为该家庭的孩子成员
      const parentProfile = await this.db
        .select({ familyId: appProfile.familyId })
        .from(appProfile)
        .where(eq(appProfile.userId, userId))
        .limit(1);
      const familyId = parentProfile[0]?.familyId;
      if (familyId) {
        await this.db
          .update(appProfile)
          .set({ familyId })
          .where(eq(appProfile.userId, demoUserId));
      }
    } else if (me.role === 'teacher') {
      await this.db.insert(teachingLink).values({
        teacherUserId: userId,
        studentUserId: demoUserId,
        subject: '数学',
      });
    }
    await this.seedStudentData(demoUserId);

    if (me.role === 'admin') {
      await this.db.insert(article).values({
        title: '【演示】三个月从 62 分到 92 分：错题本的用法',
        columnType: 'case',
        summary: '演示内容：展示学生案例栏目效果。',
        content: '这是演示内容，用于展示文章阅读与分享效果。',
        authorUserId: userId,
        status: 'published',
      });
    }
    return { created: 1 };
  }

  /** 清除当前用户视角下的全部演示数据 */
  async clear(userId: string): Promise<{ removed: number }> {
    const me = await this.accountService.findProfile(userId);
    if (!me) return { removed: 0 };

    // 关联到的演示学生账号
    const demoStudentIds: string[] = [];
    if (me.role === 'parent') {
      const meProfile = await this.db
        .select({ familyId: appProfile.familyId })
        .from(appProfile)
        .where(eq(appProfile.userId, userId))
        .limit(1);
      const familyId = meProfile[0]?.familyId;
      if (familyId) {
        const members = await this.db
          .select({ userId: appProfile.userId })
          .from(appProfile)
          .where(eq(appProfile.familyId, familyId));
        members.forEach((member) => {
          if (member.userId.startsWith('demo_')) {
            demoStudentIds.push(member.userId);
          }
        });
      }
    }
    if (me.role === 'teacher' || me.role === 'admin') {
      const links = await this.db
        .select()
        .from(teachingLink)
        .where(eq(teachingLink.teacherUserId, userId));
      links.forEach((link) => {
        if (link.studentUserId.startsWith('demo_')) {
          demoStudentIds.push(link.studentUserId);
        }
      });
    }

    for (const demoId of demoStudentIds) {
      await this.db
        .delete(studyTask)
        .where(eq(studyTask.studentUserId, demoId));
      await this.db
        .delete(course)
        .where(eq(course.studentUserId, demoId));
      await this.db
        .delete(lessonLedger)
        .where(eq(lessonLedger.studentUserId, demoId));
      await this.db
        .delete(lessonAccount)
        .where(eq(lessonAccount.studentUserId, demoId));
      await this.db
        .delete(studyProgress)
        .where(eq(studyProgress.studentUserId, demoId));
      await this.db
        .delete(teachingLink)
        .where(eq(teachingLink.studentUserId, demoId));
      await this.db
        .delete(appProfile)
        .where(eq(appProfile.userId, demoId));
    }

    // 学生角色：演示数据挂在自己名下
    await this.db
      .delete(course)
      .where(
        and(
          eq(course.studentUserId, userId),
          eq(course.location, DEMO_LOCATION),
        ),
      );
    await this.db
      .delete(studyTask)
      .where(
        and(
          eq(studyTask.studentUserId, userId),
          like(studyTask.content, `${DEMO_TASK_PREFIX}%`),
        ),
      );
    await this.db
      .delete(lessonLedger)
      .where(
        and(
          eq(lessonLedger.studentUserId, userId),
          eq(lessonLedger.remark, DEMO_LOCATION),
        ),
      );
    await this.db
      .delete(lessonAccount)
      .where(eq(lessonAccount.studentUserId, userId));
    await this.db
      .delete(studyProgress)
      .where(
        and(
          eq(studyProgress.studentUserId, userId),
          eq(studyProgress.currentPoint, DEMO_POINT),
        ),
      );

    if (me.role === 'admin') {
      await this.db
        .delete(article)
        .where(like(article.title, '【演示】%'));
    }

    return { removed: 1 };
  }
}
