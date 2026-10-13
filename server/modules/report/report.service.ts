import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import {
  appProfile,
  course,
  lessonAccount,
  lessonLedger,
  studyProgress,
  studyTask,
  taskCheckin,
  teachingLink,
} from '@server/database/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { WeeklyReport, WeeklyReportSection } from '@shared/api.interface';
import { AccountService } from '../account/account.service';
import { AiService } from '@server/common/ai/ai.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
    private readonly aiService: AiService,
  ) {}

  /** 权限：学生看自己、家长看孩子、老师看学生 */
  private async assertCanView(
    userId: string,
    studentUserId: string,
  ): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    if (me.role === 'student') {
      if (userId !== studentUserId) {
        throw new ForbiddenException('只能查看自己的学习报告');
      }
      return;
    }
    if (me.role === 'admin') return;
    if (me.role === 'parent') {
      const ok = await this.accountService.canViewStudent(userId, studentUserId);
      if (!ok) throw new ForbiddenException('只能查看自己孩子的学习报告');
      return;
    }
    if (me.role === 'teacher') {
      const ok = await this.accountService.canTeachStudent(userId, studentUserId);
      if (!ok) throw new ForbiddenException('只能查看自己学生的学习报告');
    }
  }

  async weekly(
    userId: string,
    studentUserId?: string,
  ): Promise<WeeklyReport> {
    // 家长未指定孩子时默认看家庭里第一个孩子
    let target = studentUserId || '';
    if (!target) {
      const me = await this.accountService.findProfile(userId);
      if (me?.role === 'parent') {
        const meData = await this.accountService.getMe(userId);
        target = meData.children[0]?.userId ?? '';
      }
    }
    if (!target) target = userId;

    await this.assertCanView(userId, target);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const profileRows = await this.db
      .select()
      .from(appProfile)
      .where(eq(appProfile.userId, target))
      .limit(1);
    const studentName =
      profileRows.length > 0 ? profileRows[0].name ?? '孩子' : '孩子';

    const tasks = await this.db
      .select()
      .from(studyTask)
      .where(
        and(
          eq(studyTask.studentUserId, target),
          gte(studyTask.createdAt, weekStart),
          lte(studyTask.createdAt, now),
        ),
      );
    const checkins = await this.db
      .select()
      .from(taskCheckin)
      .where(
        and(
          eq(taskCheckin.studentUserId, target),
          gte(taskCheckin.createdAt, weekStart),
          lte(taskCheckin.createdAt, now),
        ),
      );
    const ledgers = await this.db
      .select()
      .from(lessonLedger)
      .where(
        and(
          eq(lessonLedger.studentUserId, target),
          gte(lessonLedger.createdAt, weekStart),
          lte(lessonLedger.createdAt, now),
        ),
      );
    const accounts = await this.db
      .select()
      .from(lessonAccount)
      .where(eq(lessonAccount.studentUserId, target));
    const progresses = await this.db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.studentUserId, target));
    const courses = await this.db
      .select()
      .from(course)
      .where(
        and(
          eq(course.studentUserId, target),
          gte(course.startAt, weekStart),
          lte(course.startAt, now),
        ),
      );

    const approved = tasks.filter((t) => t.status === 'approved').length;
    const rejected = tasks.filter((t) => t.status === 'rejected').length;
    const openCount = tasks.filter((t) => t.status === 'open').length;
    const totalMin = checkins.reduce(
      (sum, c) => sum + (c.durationMin ?? 0),
      0,
    );
    const doneCourses = courses.filter((c) => c.status === 'done').length;
    const consumed = ledgers
      .filter((l) => l.changeType === 'consume')
      .reduce((sum, l) => sum + Math.abs(l.changeAmount), 0);
    const purchased = ledgers
      .filter((l) => l.changeType === 'purchase')
      .reduce((sum, l) => sum + l.changeAmount, 0);
    const remaining = accounts.reduce(
      (sum, a) => sum + (a.totalLessons - a.usedLessons),
      0,
    );
    const passRate =
      tasks.length > 0 ? Math.round((approved / tasks.length) * 100) : 0;

    const overview: WeeklyReportSection = {
      title: '本周概览',
      lines: [
        `布置任务 ${tasks.length} 个，已通过 ${approved} 个，待完成 ${openCount} 个`,
        `完成打卡 ${checkins.length} 次，累计学习 ${totalMin} 分钟`,
        `上课 ${doneCourses} 节，消耗课时 ${consumed}`,
      ],
    };

    const highlights: string[] = [];
    if (passRate >= 80 && tasks.length > 0) {
      highlights.push(`任务通过率 ${passRate}%，完成质量稳定`);
    }
    if (totalMin >= 120) {
      highlights.push('本周学习投入充分，累计超过 2 小时');
    }
    const progressUp = progresses.filter((p) => p.percent >= 70);
    if (progressUp.length > 0) {
      highlights.push(
        `${progressUp.map((p) => `${p.subject}·${p.chapter}`).join('、')} 已完成 70% 以上`,
      );
    }
    if (highlights.length === 0) {
      highlights.push('本周按时完成了基本学习任务');
    }

    const improvements: string[] = [];
    if (rejected > 0) {
      improvements.push(`${rejected} 个任务被退回，建议重点订正后再提交`);
    }
    const lagging = progresses.filter((p) => p.percent < 50);
    lagging.forEach((p) => {
      improvements.push(
        `${p.subject}·${p.chapter} 完成度仅 ${p.percent}%，需要重点关注`,
      );
    });
    if (openCount > 0) {
      improvements.push(`还有 ${openCount} 个任务未完成`);
    }
    if (improvements.length === 0) {
      improvements.push('本周无明显薄弱项，保持节奏');
    }

    const suggestions: string[] = [];
    if (lagging.length > 0) {
      suggestions.push('下周针对薄弱章节安排一次专项练习');
    }
    if (remaining <= 3) {
      suggestions.push(`剩余课时仅 ${remaining}，建议提前规划续费`);
    }
    if (suggestions.length === 0) {
      suggestions.push('按当前节奏推进即可，可适当增加拓展练习');
    }

    // 文案由 AI 层生成（LLM 或规则版），结构化 sections 仍由数据计算，保证准确
    const aiText = await this.aiService.polishWeeklyReport({
      studentName,
      weekStart: weekStart.toISOString(),
      weekEnd: now.toISOString(),
      stats: {
        taskTotal: tasks.length,
        taskApproved: approved,
        checkinCount: checkins.length,
        totalMinutes: totalMin,
        courseDone: doneCourses,
        consumedLessons: consumed,
        purchasedLessons: purchased,
        remainingLessons: remaining,
      },
      progress: progresses.map((p) => ({
        subject: p.subject,
        chapter: p.chapter,
        percent: p.percent,
      })),
    });

    const text = [
      `【${studentName} 学习周报】`,
      `${weekStart.toLocaleDateString('zh-CN')} - ${now.toLocaleDateString('zh-CN')}`,
      '',
      aiText,
      '',
      '◆ 本周概览',
      ...overview.lines.map((l) => `· ${l}`),
      '',
      '◆ 待改进',
      ...improvements.map((l) => `· ${l}`),
      '',
      '◆ 下周建议',
      ...suggestions.map((l) => `· ${l}`),
      '',
      `课时：本周消耗 ${consumed}，新增 ${purchased}，剩余 ${remaining}`,
    ].join('\n');

    return {
      studentName,
      weekStart: weekStart.toISOString(),
      weekEnd: now.toISOString(),
      stats: {
        taskTotal: tasks.length,
        taskApproved: approved,
        checkinCount: checkins.length,
        totalMinutes: totalMin,
        courseDone: doneCourses,
        consumedLessons: consumed,
        purchasedLessons: purchased,
        remainingLessons: remaining,
      },
      sections: [
        overview,
        { title: '亮点', lines: highlights },
        { title: '待改进', lines: improvements },
        { title: '下周建议', lines: suggestions },
      ],
      text,
    };
  }
}
