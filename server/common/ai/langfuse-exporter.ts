import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SpanRecord } from '../../modules/ai/ai-trace.service';

interface LangfuseEvent {
  id: string;
  type: 'trace' | 'span' | 'generation' | 'score';
  timestamp: string;
  traceId?: string;
  name?: string;
  userId?: string;
  model?: string;
  input?: unknown;
  output?: unknown;
  metadata?: unknown;
  startTime?: string;
  endTime?: string;
  level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  statusMessage?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  value?: number | string;
  comment?: string;
  dataType?: 'NUMERIC' | 'CATEGORICAL';
}

/**
 * Langfuse 导出器：把 span 树映射为 Langfuse ingestion 事件（env 激活）。
 *
 * 字段映射（Langfuse /api/public/ingestion，Basic auth publicKey:secretKey）：
 *   - trace：support.ask 一次调用（traceId = ai_invocation_log.callId）
 *   - span：kb.search / prompt.build / answer.compose → type:'span'
 *   - generation：llm.call → type:'generation'（model/usage tokens/input/output）
 *   - score：feedback 👍👎 → type:'score'（value 1/0，name user-feedback）
 *
 * 启用（.env.local）：
 *   LANGFUSE_PUBLIC_KEY=pk-lf-xxx
 *   LANGFUSE_SECRET_KEY=sk-lf-xxx
 *   LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或自建实例
 *
 * 未配置 → no-op（enabled=false，调用方零改动）。
 * 发送 fire-and-forget：失败只 warn，绝不阻塞对话主链路（红线）。
 */
@Injectable()
export class LangfuseExporter {
  private readonly logger = new Logger(LangfuseExporter.name);
  private readonly publicKey = process.env.LANGFUSE_PUBLIC_KEY ?? '';
  private readonly secretKey = process.env.LANGFUSE_SECRET_KEY ?? '';
  private readonly baseUrl = (process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com').replace(/\/$/, '');

  get enabled(): boolean {
    return Boolean(this.publicKey && this.secretKey);
  }

  /** 导出一条完整 trace（trace + 全部 observations）；fire-and-forget */
  exportTrace(input: {
    traceId: string;
    name: string;
    userId: string;
    latencyMs: number;
    metadata?: Record<string, unknown>;
    /** llm.call 的输入/输出摘要（进 generation 观测） */
    llmSpan?: SpanRecord;
    spans: SpanRecord[];
  }): void {
    if (!this.enabled) return;
    const events: LangfuseEvent[] = [
      {
        id: randomUUID(),
        type: 'trace',
        timestamp: new Date().toISOString(),
        traceId: input.traceId,
        name: input.name,
        userId: input.userId,
        metadata: input.metadata ?? {},
      },
    ];
    for (const span of input.spans) {
      const startTime = new Date(span.startedAt).toISOString();
      const endTime = new Date(span.startedAt + (span.latencyMs ?? 0)).toISOString();
      const isGeneration = span.spanType === 'generation';
      events.push({
        id: randomUUID(),
        type: isGeneration ? 'generation' : 'span',
        timestamp: startTime,
        traceId: input.traceId,
        name: span.name,
        model: span.model,
        startTime,
        endTime,
        level: span.status === 'error' ? 'ERROR' : 'DEFAULT',
        statusMessage: span.status === 'error' ? 'degraded' : undefined,
        input: span.payload,
        // generation 才带 output（回答正文），span 只带 payload 摘要
        output: isGeneration && input.llmSpan?.payload ? (input.llmSpan.payload as { answer?: string }).answer : undefined,
        usage: isGeneration
          ? { promptTokens: span.promptTokens, completionTokens: span.completionTokens, totalTokens: span.totalTokens }
          : undefined,
        metadata: span.payload,
      });
    }
    void this.ingest(events);
  }

  /** 导出用户反馈 score（👍=1 / 👎=0）；fire-and-forget */
  exportScore(input: { traceId: string; name?: string; value: number; comment?: string }): void {
    if (!this.enabled) return;
    void this.ingest([
      {
        id: randomUUID(),
        type: 'score',
        timestamp: new Date().toISOString(),
        traceId: input.traceId,
        name: input.name ?? 'user-feedback',
        value: input.value,
        comment: input.comment,
        dataType: 'NUMERIC',
      },
    ]);
  }

  private async ingest(batch: LangfuseEvent[]): Promise<void> {
    try {
      const auth = Buffer.from(`${this.publicKey}:${this.secretKey}`).toString('base64');
      const res = await fetch(`${this.baseUrl}/api/public/ingestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify({ batch, metadata: {} }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Langfuse 导出失败 ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (error) {
      this.logger.warn(`Langfuse 导出异常（忽略）：${(error as Error).message}`);
    }
  }
}
