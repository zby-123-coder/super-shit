import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import { studyTask, wrongQuestion } from '@server/database/schema';
import { eq } from 'drizzle-orm';
import { WrongQuestionService } from './wrong-question.service';
import { MessageService } from '../message/message.service';

/**
 * 复习提醒定时任务（数据飞轮的「行动」环节）。
 *
 * 每天 08:00 扫描到期错题 → 生成「复习任务」并通知学生。
 * 防骚扰设计：
 *   1. 每道错题同时只存在一个等待中的复习任务（review_task_id 去重）
 *   2. 完成复习/跳过后才清理，不会重复打扰
 *   3. 轮次有上限（默认 4 轮），到顶标记 mastered 不再提醒
 *   4. 时间可用 WRQ_REMINDER_CRON 覆盖（默认每天 8 点）
 */
@Injectable()
export class ReviewReminderService {
  private readonly logger = new Logger(ReviewReminderService.name);
  private readonly cron =
    process.env.WRQ_REMINDER_CRON || '0 0 8 * * *';

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly wrongQuestionService: WrongQuestionService,
    private readonly messageService: MessageService,
  ) {}

  @Cron(process.env.WRQ_REMINDER_CRON || '0 0 8 * * *')
  async runDaily(): Promise<void> {
    const due = await this.wrongQuestionService.dueReviews();
    if (due.length === 0) {
      this.logger.log('今日没有到期错题，跳过');
      return;
    }
    this.logger.log(`今日到期错题 ${due.length} 道，开始生成复习任务`);
    let created = 0;
    for (const item of due) {
      try {
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + 1);
        const inserted = await this.db
          .insert(studyTask)
          .values({
            teacherUserId: 'system',
            studentUserId: item.studentUserId,
            subject: item.subject,
            title: `【复习】${item.title.slice(0, 60)}`,
            content: `这是你的第 ${(item.reviewStage ?? 0) + 1} 轮复习。先独立做一遍，再对照原题与解析。`,
            dueAt,
          })
          .returning();
        const task = inserted[0];
        await this.wrongQuestionService.markReviewTaskCreated(item.id, task.id);
        await this.messageService.notify({
          userId: item.studentUserId,
          msgType: 'task',
          title: '错题复习提醒',
          content: `今天该复习「${item.title.slice(0, 40)}」了，完成任务后记得标记「完成复习」`,
          linkPath: '/tasks',
        });
        created += 1;
      } catch (error) {
        this.logger.error(`复习任务生成失败 ${item.id}: ${(error as Error).message}`);
      }
    }
    this.logger.log(`复习任务生成完成：${created}/${due.length}`);
  }

  /** 手动触发（联调/测试用）：与定时任务同一逻辑 */
  async runNow(): Promise<{ due: number; created: number }> {
    const due = await this.wrongQuestionService.dueReviews();
    let created = 0;
    for (const item of due) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 1);
      const inserted = await this.db
        .insert(studyTask)
        .values({
          teacherUserId: 'system',
          studentUserId: item.studentUserId,
          subject: item.subject,
          title: `【复习】${item.title.slice(0, 60)}`,
          content: `这是你的第 ${(item.reviewStage ?? 0) + 1} 轮复习。`,
          dueAt,
        })
        .returning();
      await this.wrongQuestionService.markReviewTaskCreated(item.id, inserted[0].id);
      created += 1;
    }
    return { due: due.length, created };
  }
}
