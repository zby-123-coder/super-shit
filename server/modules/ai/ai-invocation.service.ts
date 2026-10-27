import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { aiInvocationLog } from '@server/database/schema';

/** 安全序列化（循环引用/超长截断都不该影响主流程） */
function safeSerialize(value: unknown): string {
  try {
    const text = JSON.stringify(value);
    return text.length > 20000 ? `${text.slice(0, 20000)}…（已截断）` : text;
  } catch {
    return String(value).slice(0, 20000);
  }
}

export interface InvocationMeta {
  userId: string;
  role?: string;
  feature: string;
  scopeType?: string;
  scopeId?: string;
}

/**
 * AI 调用日志：每次真实调用都留痕（callId / 时间 / 功能 / 耗时 / 提供方 / 状态）。
 *
 * 目的（对应产品诉求）：
 *   1. 前端「我的调用历史」可回看每一次 AI 调用，而不是调用完就没了
 *   2. 排查"这次为什么慢/为什么降级"有据可查
 *   3. 数据隔离：list() 只按 userId 过滤，用户看不到别人的调用
 */
@Injectable()
export class AiInvocationService {
  private readonly logger = new Logger(AiInvocationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /** 写一条调用日志；失败不影响主流程（不能因为日志挂掉业务）
   *  extra.callId：调用方预生成的 trace id（span 树用它做 traceId，需与日志一致）；
   *  不传则由数据库生成。 */
  async record(
    meta: InvocationMeta,
    extra: {
      provider: string;
      status: 'success' | 'degraded' | 'failed';
      latencyMs: number;
      preview?: string;
      /** 完整结果（供回看）；不传则只存摘要 */
      full?: unknown;
      /** 预生成的调用 id（span 树 traceId） */
      callId?: string;
    },
  ) {
    try {
      const [row] = await this.db
        .insert(aiInvocationLog)
        .values({
          ...(extra.callId ? { callId: extra.callId } : {}),
          userId: meta.userId,
          role: meta.role,
          feature: meta.feature,
          scopeType: meta.scopeType,
          scopeId: meta.scopeId,
          provider: extra.provider,
          status: extra.status,
          latencyMs: extra.latencyMs,
          resultPreview: extra.preview?.slice(0, 500),
          resultFull: extra.full === undefined ? null : safeSerialize(extra.full),
        })
        .returning({ callId: aiInvocationLog.callId });
      return row?.callId ?? null;
    } catch (error) {
      this.logger.warn(`调用日志写入失败（忽略）：${(error as Error).message}`);
      return null;
    }
  }

  /** 按 callId 查单条（feedback 身份校验用：只能给自己的调用留反馈） */
  async get(callId: string) {
    const [row] = await this.db
      .select()
      .from(aiInvocationLog)
      .where(eq(aiInvocationLog.callId, callId))
      .limit(1);
    return row ?? null;
  }

  /** 我的调用历史（严格按 userId 隔离，功能筛选只能收窄不能越权） */
  async list(userId: string, opts: { feature?: string; limit?: number } = {}) {
    const conditions = [eq(aiInvocationLog.userId, userId)];
    if (opts.feature) conditions.push(eq(aiInvocationLog.feature, opts.feature));
    const rows = await this.db
      .select()
      .from(aiInvocationLog)
      .where(and(...conditions))
      .orderBy(desc(aiInvocationLog.createdAt))
      .limit(Math.min(Math.max(opts.limit ?? 20, 1), 100));
    return rows.map((row) => ({
      callId: row.callId,
      feature: row.feature,
      scopeType: row.scopeType ?? '',
      scopeId: row.scopeId ?? '',
      provider: row.provider,
      status: row.status,
      latencyMs: row.latencyMs ?? 0,
      preview: row.resultPreview ?? '',
      /** 完整结果（可回看本次 AI 的完整输出） */
      full: row.resultFull ?? '',
      createdAt: row.createdAt,
    }));
  }
}