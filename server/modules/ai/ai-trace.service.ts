import { Inject, Injectable, Logger } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { aiSpan } from '@server/database/schema';

/** 一次子观测的记录（execute 过程中收集，结束后批量落库） */
export interface SpanRecord {
  name: string;
  /** span 子观测 / generation LLM 调用 / event 事件（feedback） */
  spanType: 'span' | 'generation' | 'event';
  /** 阶段开始时间（Date.now() 毫秒）；event 可不传（落库时取当前时间） */
  startedAt?: number;
  latencyMs?: number;
  status?: 'success' | 'error';
  payload?: Record<string, unknown>;
  /** LLM 调用的模型名（generation 用） */
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * AI 观测层：span 树写入与查询（trace 根 = ai_invocation_log.callId）。
 *
 * 设计：
 *   1. 与调用日志解耦：span 表只存子观测，用户可回看的调用历史（ai_invocation_log）不变
 *   2. 写入失败不影响主流程（不能因为观测挂掉业务）——内部全部自兜底
 *   3. Langfuse 映射：span→observation / generation→generation / event(feedback)→score
 *      （映射与导出见 common/ai/langfuse-exporter.ts）
 */
@Injectable()
export class AiTraceService {
  private readonly logger = new Logger(AiTraceService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /** 批量写 span（一次 AI 调用的全部子观测）；失败静默，绝不阻塞主流程 */
  async writeSpans(traceId: string, spans: SpanRecord[]): Promise<void> {
    if (spans.length === 0) return;
    try {
      const now = Date.now();
      await this.db.insert(aiSpan).values(spans.map((s) => ({
        traceId,
        spanType: s.spanType,
        name: s.name,
        status: s.status ?? 'success',
        latencyMs: s.latencyMs ?? null,
        model: s.model ?? null,
        payload: s.payload ?? null,
        promptTokens: s.promptTokens ?? null,
        completionTokens: s.completionTokens ?? null,
        totalTokens: s.totalTokens ?? null,
        ...(s.startedAt !== undefined
          ? { createdAt: new Date(s.startedAt) }
          : {}),
      })));
    } catch (error) {
      this.logger.warn(`span 写入失败（忽略）：${(error as Error).message}`);
    }
  }

  /** 单条事件（如 feedback）；失败静默 */
  async recordEvent(traceId: string, span: SpanRecord): Promise<void> {
    await this.writeSpans(traceId, [span]);
  }

  /** 按 trace 查 span 树（排查/调试用） */
  async list(traceId: string) {
    const rows = await this.db
      .select()
      .from(aiSpan)
      .where(eq(aiSpan.traceId, traceId))
      .orderBy(asc(aiSpan.createdAt));
    return rows.map((row) => ({
      id: row.id,
      traceId: row.traceId,
      spanType: row.spanType,
      name: row.name,
      status: row.status,
      latencyMs: row.latencyMs ?? 0,
      model: row.model ?? '',
      payload: row.payload ?? {},
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      totalTokens: row.totalTokens,
      createdAt: row.createdAt,
    }));
  }
}
