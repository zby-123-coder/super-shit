import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import {
  appProfile,
  lessonAccount,
  studyTask,
  studentInsight,
  taskCheckin,
  wrongQuestion,
} from '@server/database/schema';
import { AiService } from '@server/common/ai/ai.service';
import type { InsightAction } from '@server/common/ai/ai.types';
import { AccountService } from '../account/account.service';
import { MessageService } from '../message/message.service';

type InsightRow = typeof studentInsight.$inferSelect;

/** 状态严重度排序（AI 与规则交叉校验时用：取更严重的一档） */
const LEVEL_RANK: Record<string, number> = {
  on_track: 0,
  slipping: 1,
  at_risk: 2,
  churning: 3,
};

/**
 * 学习状态洞察与决策编排（飞轮的「预测层」）。
 *
 * 与学情诊断的区别：
 *   诊断回答"现在学得怎样"（过去 30 天的解释）
 *   洞察回答"接下来会发生什么、现在该做什么"（预测 + 决策）
 *
 * 设计要点：
 *   1. 多源信号：遗忘曲线偏离 / 打卡停滞 / 任务完成率 / 课时余额 / 错题增长 / 诊断四维
 *   2. 状态分级：on_track → slipping → at_risk → churning
 *   3. 动作编排：不同状态触发不同角色动作（学生提示/老师告警/家长通报/习题包/续费提醒）
 *   4. 双引擎交叉校验：AI 可升级风险但不可降级（防止模型漏判导致学生流失）
 */
@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
    private readonly accountService: AccountService,
    private readonly messageService: MessageService,
  ) {}

  /** 采集多源信号并计算状态（不落库，供接口与定时任务复用） */
  async evaluate(studentUserId: string): Promise<InsightRow> {
    const student = await this.accountService.findProfile(studentUserId);
    const name = student?.name ?? '同学';
    const now = new Date();
    const d14 = new Date(now.getTime() - 14 * 86400000);

    const [reviews, tasks, checkins, wrongs, lessons] = await Promise.all([
      this.db
        .select()
        .from(wrongQuestion)
        .where(
          and(
            eq(wrongQuestion.studentUserId, studentUserId),
            sql`${wrongQuestion.nextReviewAt} IS NOT NULL`,
          ),
        ),
      this.db
        .select()
        .from(studyTask)
        .where(
          and(
            eq(studyTask.studentUserId, studentUserId),
            gte(studyTask.createdAt, d14),
          ),
        ),
      this.db
        .select()
        .from(taskCheckin)
        .where(
          and(
            eq(taskCheckin.studentUserId, studentUserId),
            gte(taskCheckin.createdAt, new Date(now.getTime() - 60 * 86400000)),
          ),
        )
        .orderBy(desc(taskCheckin.createdAt))
        .limit(30),
      this.db
        .select()
        .from(wrongQuestion)
        .where(
          and(
            eq(wrongQuestion.studentUserId, studentUserId),
            gte(wrongQuestion.createdAt, d14),
          ),
        ),
      this.db
        .select()
        .from(lessonAccount)
        .where(eq(lessonAccount.studentUserId, studentUserId)),
    ]);

    // 信号 1：遗忘曲线偏离（逾期未复习 / 总排期）
    const overdueReviews = reviews.filter(
      (item) => item.nextReviewAt && item.nextReviewAt.getTime() < now.getTime(),
    ).length;
    const totalReviews = reviews.length;

    // 信号 2：任务完成率（近 14 天 approved / 总任务）
    const doneTasks = tasks.filter((task) => task.status === 'approved').length;
    const taskDoneRate = tasks.length > 0 ? doneTasks / tasks.length : 1;

    // 信号 3：打卡停滞天数
    const lastCheckin = checkins[0]?.createdAt;
    const daysSinceLastCheckin = lastCheckin
      ? Math.floor((now.getTime() - lastCheckin.getTime()) / 86400000)
      : 99;

    // 信号 4：课时余额
    const remainingLessons = lessons.reduce(
      (sum, item) => sum + (item.totalLessons - item.usedLessons),
      0,
    );

    // 信号 5：错题增长（近 14 天新增）
    const newWrongs14d = wrongs.length;

    // 信号 6：诊断四维（联动学情诊断）
    let diagnosisScores: { label: string; score: number }[] = [];
    try {
      const diagnosis = await this.diagnosisScores(studentUserId);
      diagnosisScores = diagnosis;
    } catch (error) {
      this.logger.warn(`诊断联动失败：${(error as Error).message}`);
    }

    const aiResult = await this.aiService.insight({
      studentName: name,
      signals: {
        overdueReviews,
        totalReviews,
        taskDoneRate: Number(taskDoneRate.toFixed(2)),
        daysSinceLastCheckin,
        remainingLessons,
        newWrongs14d,
        diagnosisScores,
      },
    });

    // 交叉校验：AI 建议风险只升不降（规则版是 ground truth 下限）
    const ruleResult = await this.ruleLevel({
      overdueReviews,
      totalReviews,
      taskDoneRate,
      daysSinceLastCheckin,
      remainingLessons,
      newWrongs14d,
    });
    const finalLevel =
      LEVEL_RANK[aiResult.level] >= LEVEL_RANK[ruleResult.level]
        ? aiResult.level
        : ruleResult.level;

    const inserted = await this.db
      .insert(studentInsight)
      .values({
        studentUserId,
        level: finalLevel,
        score: Math.max(aiResult.score, ruleResult.score),
        signals: {
          overdueReviews,
          totalReviews,
          taskDoneRate,
          daysSinceLastCheckin,
          remainingLessons,
          newWrongs14d,
          diagnosisScores,
        },
        headline: aiResult.headline,
        evidence: aiResult.evidence,
        actions: aiResult.actions,
        executed: false,
      })
      .returning();
    return inserted[0];
  }

  /** 规则版等级（与 provider 内逻辑保持一致的轻量版，用于交叉校验下限） */
  private async ruleLevel(signals: {
    overdueReviews: number;
    totalReviews: number;
    taskDoneRate: number;
    daysSinceLastCheckin: number;
    remainingLessons: number;
    newWrongs14d: number;
  }): Promise<{ level: string; score: number }> {
    // 直接复用 AiService 的规则实现路径：这里只算等级下限，避免重复判定逻辑漂移
    const overdueRate =
      signals.totalReviews > 0 ? signals.overdueReviews / signals.totalReviews : 0;
    let score = 0;
    if (overdueRate >= 0.5) score += 35;
    else if (overdueRate > 0) score += 15;
    if (signals.daysSinceLastCheckin >= 7) score += 30;
    else if (signals.daysSinceLastCheckin >= 3) score += 12;
    if (signals.taskDoneRate < 0.5) score += 20;
    if (signals.remainingLessons <= 2) score += 15;
    if (signals.newWrongs14d >= 8) score += 10;
    const level = score >= 60 ? 'churning' : score >= 35 ? 'at_risk' : score >= 15 ? 'slipping' : 'on_track';
    return { level, score };
  }

  /** 诊断四维联动（轻量：直接算四维，不触发完整 diagnosis 的 AI 调用） */
  private async diagnosisScores(
    studentUserId: string,
  ): Promise<{ label: string; score: number }[]> {
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 86400000);
    const [checkins, wrongs] = await Promise.all([
      this.db
        .select()
        .from(taskCheckin)
        .where(
          and(
            eq(taskCheckin.studentUserId, studentUserId),
            gte(taskCheckin.createdAt, since),
          ),
        ),
      this.db
        .select()
        .from(wrongQuestion)
        .where(
          and(
            eq(wrongQuestion.studentUserId, studentUserId),
            gte(wrongQuestion.createdAt, since),
          ),
        ),
    ]);
    const approved = checkins.filter((c) => c.status === 'approved').length;
    const corrected = wrongs.filter((w) => w.status !== 'open').length;
    return [
      {
        label: '投入度',
        score: Math.min(100, Math.round((checkins.length / 10) * 100)),
      },
      {
        label: '完成质量',
        score: checkins.length ? Math.round((approved / checkins.length) * 100) : 0,
      },
      {
        label: '知识掌握',
        score: wrongs.length ? Math.round((corrected / wrongs.length) * 100) : 100,
      },
    ];
  }

  /** 执行决策动作（真实触达：站内通知/提示） */
  async executeActions(insight: InsightRow): Promise<number> {
    const actions = (insight.actions ?? []) as InsightAction[];
    let executed = 0;
    for (const action of actions) {
      try {
        if (
          action.type === 'teacher_alert' ||
          action.type === 'teacher_digest' ||
          action.type === 'parent_notice' ||
          action.type === 'renewal_reminder' ||
          action.type === 'student_nudge'
        ) {
          const targets = await this.targetsOf(insight.studentUserId, action.target);
          for (const userId of targets) {
            await this.messageService.notify({
              userId,
              msgType: 'insight',
              title: this.titleOf(action.type),
              content: action.message,
              linkPath: '/home',
            });
            executed += 1;
          }
        } else if (action.type === 'practice_pack') {
          // 习题包：生成一条复习任务，引导学生完成针对性练习
          const dueAt = new Date();
          dueAt.setDate(dueAt.getDate() + 7);
          await this.db.insert(studyTask).values({
            teacherUserId: 'system',
            studentUserId: insight.studentUserId,
            subject: '综合',
            title: '【专项练习】错题同类题巩固',
            content: action.message,
            dueAt,
          });
          executed += 1;
        }
      } catch (error) {
        this.logger.error(`动作执行失败 ${action.type}: ${(error as Error).message}`);
      }
    }
    await this.db
      .update(studentInsight)
      .set({ executed: executed > 0 })
      .where(eq(studentInsight.id, insight.id));
    return executed;
  }

  private titleOf(type: string): string {
    if (type === 'teacher_alert') return '学情告警';
    if (type === 'teacher_digest') return '学情提醒';
    if (type === 'parent_notice') return '学情通报';
    if (type === 'renewal_reminder') return '课时提醒';
    return '学习提醒';
  }

  /** 动作目标的 userId 列表 */
  private async targetsOf(
    studentUserId: string,
    target: string,
  ): Promise<string[]> {
    if (target === 'student') return [studentUserId];
    if (target === 'parent') {
      return this.accountService.parentsOfStudent(studentUserId);
    }
    // teacher：带班老师
    return this.accountService.teachersOfStudent(studentUserId);
  }

  /** 查询某学生最新状态 */
  async latest(
    userId: string,
    studentUserId?: string,
  ): Promise<InsightRow | null> {
    const target = studentUserId || userId;
    await this.assertCanView(userId, target);
    const rows = await this.db
      .select()
      .from(studentInsight)
      .where(eq(studentInsight.studentUserId, target))
      .orderBy(desc(studentInsight.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  /** 风险学生列表（老师/管理员视角） */
  async riskList(userId: string): Promise<InsightRow[]> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    const students =
      me.role === 'admin'
        ? await this.accountService.allStudents()
        : await this.accountService.studentsOfTeacher(userId);
    if (students.length === 0) return [];
    const rows = await this.db
      .select()
      .from(studentInsight)
      .where(
        and(
          sql`${studentInsight.studentUserId} = ANY(${students})`,
          sql`${studentInsight.level} <> 'on_track'`,
        ),
      )
      .orderBy(desc(studentInsight.createdAt))
      .limit(50);
    // 每个学生只取最新一条
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.studentUserId)) return false;
      seen.add(row.studentUserId);
      return true;
    });
  }

  private async assertCanView(userId: string, studentUserId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    if (me.role === 'admin') return;
    if (me.role === 'student') {
      if (userId !== studentUserId) throw new ForbiddenException('只能查看自己的学情状态');
      return;
    }
    if (me.role === 'parent') {
      const ok = await this.accountService.canViewStudent(userId, studentUserId);
      if (!ok) throw new ForbiddenException('只能查看自己孩子的学情状态');
      return;
    }
    const ok = await this.accountService.canTeachStudent(userId, studentUserId);
    if (!ok) throw new ForbiddenException('只能查看自己学生的学情状态');
  }

  /** 每日扫描：对所有在读学生做状态评估并执行动作（09:00） */
  @Cron(process.env.INSIGHT_SCAN_CRON || '0 0 9 * * *')
  async dailyScan(): Promise<void> {
    const students = await this.accountService.allStudents();
    this.logger.log(`状态扫描开始：${students.length} 名学生`);
    let risky = 0;
    for (const studentUserId of students) {
      try {
        const insight = await this.evaluate(studentUserId);
        if (insight.level !== 'on_track') {
          const executed = await this.executeActions(insight);
          risky += 1;
          this.logger.log(
            `${insight.headline}（${insight.level}，执行 ${executed} 个动作）`,
          );
        }
      } catch (error) {
        this.logger.error(`扫描失败 ${studentUserId}: ${(error as Error).message}`);
      }
    }
    this.logger.log(`状态扫描完成：${risky}/${students.length} 名学生需要关注`);
  }

  /** 手动扫描（管理员/联调） */
  async scanNow(): Promise<{ total: number; risky: number }> {
    const students = await this.accountService.allStudents();
    let risky = 0;
    for (const studentUserId of students) {
      try {
        const insight = await this.evaluate(studentUserId);
        if (insight.level !== 'on_track') {
          await this.executeActions(insight);
          risky += 1;
        }
      } catch (error) {
        this.logger.error(`手动扫描失败 ${studentUserId}: ${(error as Error).message}`);
      }
    }
    return { total: students.length, risky };
  }
}
