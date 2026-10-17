import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { questionBank } from '@server/database/schema';
import type { QuestionBankItem } from '@shared/api.interface';
import { AiService } from '@server/common/ai/ai.service';

export interface RecommendInput {
  subject: string;
  knowledgePoint: string;
  chapter?: string;
  /** 需要返回的题目数量 */
  count?: number;
}

/**
 * 题库服务：举一反三的主力是「库内检索」（快、准、免费、可控），
 * 库内不足时调 AI 生成变式题补齐，并**回写题库**（越用越厚）。
 */
@Injectable()
export class QuestionBankService {
  private readonly logger = new Logger(QuestionBankService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
  ) {}

  async list(params: { subject?: string; knowledgePoint?: string }): Promise<QuestionBankItem[]> {
    const conditions = [];
    if (params.subject) conditions.push(eq(questionBank.subject, params.subject));
    if (params.knowledgePoint) {
      conditions.push(like(questionBank.knowledgePoint, `%${params.knowledgePoint}%`));
    }
    const rows = await this.db
      .select()
      .from(questionBank)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionBank.useCount))
      .limit(100);
    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      chapter: row.chapter ?? '',
      knowledgePoint: row.knowledgePoint ?? '',
      title: row.title,
      answer: row.answer ?? '',
      analysis: row.analysis ?? '',
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      source: row.source,
    }));
  }

  /**
   * 推荐同类题：先查库；不足 count 条时用 AI 生成变式补齐并入库。
   * 返回结果中 fromBank=库内检索 / fromAi=AI 生成（已入库）。
   */
  async recommend(input: RecommendInput): Promise<QuestionBankItem[]> {
    const count = input.count ?? 3;
    // 1. 库内检索：同学科同知识点，按被使用次数（热度）排序
    const bankRows = await this.db
      .select()
      .from(questionBank)
      .where(
        and(
          eq(questionBank.subject, input.subject),
          like(questionBank.knowledgePoint, `%${input.knowledgePoint}%`),
        ),
      )
      .orderBy(desc(questionBank.useCount))
      .limit(count);
    const items: QuestionBankItem[] = bankRows.map((row) => ({
      id: row.id,
      subject: row.subject,
      chapter: row.chapter ?? '',
      knowledgePoint: row.knowledgePoint ?? '',
      title: row.title,
      answer: row.answer ?? '',
      analysis: row.analysis ?? '',
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      source: row.source,
    }));
    if (items.length >= count) {
      await this.bumpUseCount(items.map((item) => item.id));
      return items;
    }

    // 2. 库内不足：AI 生成变式题补齐（以库内第一题为原题，或用知识点描述）
    const original = bankRows[0]?.title ?? `${input.knowledgePoint} 相关练习题`;
    try {
      const variant = await this.aiService.variant({
        subject: input.subject,
        title: original,
        knowledgePoint: input.knowledgePoint,
      });
      if (variant) {
        const inserted = await this.db
          .insert(questionBank)
          .values({
            subject: input.subject,
            chapter: input.chapter ?? null,
            knowledgePoint: input.knowledgePoint,
            title: variant,
            source: 'ai',
          })
          .returning();
        const row = inserted[0];
        items.push({
          id: row.id,
          subject: row.subject,
          chapter: row.chapter ?? '',
          knowledgePoint: row.knowledgePoint ?? '',
          title: row.title,
          answer: '',
          analysis: '',
          difficulty: 'medium',
          source: 'ai',
        });
      }
    } catch (error) {
      this.logger.warn(`AI 变式生成失败：${(error as Error).message}`);
    }
    return items;
  }

  /** 手动录题（老师/管理员） */
  async create(input: {
    subject: string;
    chapter?: string;
    knowledgePoint?: string;
    title: string;
    answer?: string;
    analysis?: string;
    difficulty?: string;
  }): Promise<QuestionBankItem> {
    const inserted = await this.db
      .insert(questionBank)
      .values({
        subject: input.subject,
        chapter: input.chapter ?? null,
        knowledgePoint: input.knowledgePoint ?? null,
        title: input.title,
        answer: input.answer ?? null,
        analysis: input.analysis ?? null,
        difficulty: input.difficulty ?? 'medium',
        source: 'manual',
      })
      .returning();
    const row = inserted[0];
    return {
      id: row.id,
      subject: row.subject,
      chapter: row.chapter ?? '',
      knowledgePoint: row.knowledgePoint ?? '',
      title: row.title,
      answer: row.answer ?? '',
      analysis: row.analysis ?? '',
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      source: row.source,
    };
  }

  private async bumpUseCount(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(questionBank)
      .set({ useCount: sql`${questionBank.useCount} + 1` })
      .where(eq(questionBank.id, ids[0]));
  }
}
