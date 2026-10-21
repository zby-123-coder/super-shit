import { Injectable, Logger } from '@nestjs/common';

interface InFlightEntry<T> {
  promise: Promise<T>;
  startedAt: number;
  done: boolean;
  result?: T;
}

/**
 * AI 调用幂等/并发保护。
 *
 * 解决的问题：用户连点「生成」按钮、或多端同时触发 → 同一请求打多次 LLM，
 * 既烧钱又让缓存写入互相覆盖。
 *
 * 两层防护：
 *   1. in-flight 去重：同一 (userId, feature, scopeId) 正在执行时，后来者直接复用同一个 Promise
 *   2. 短窗口结果复用：刚完成的结果保留 DEDUP_WINDOW_MS，窗口内重复请求直接返回上次结果
 *      （不触碰 LLM），防止"点了没反应又点一下"造成二次调用
 */
@Injectable()
export class AiIdempotencyService {
  private readonly logger = new Logger(AiIdempotencyService.name);
  /** 结果复用窗口：比一次 LLM 调用的典型耗时略长即可 */
  private static readonly DEDUP_WINDOW_MS = 10_000;
  private static readonly MAX_ENTRIES = 500;

  private readonly inFlight = new Map<string, InFlightEntry<unknown>>();

  private keyOf(userId: string, feature: string, scopeId = ''): string {
    return `${userId}|${feature}|${scopeId}`;
  }

  /**
   * 执行一次受保护的 AI 调用。
   * dedup=false 时强制新调用（如用户明确点「重新生成」）。
   */
  async run<T>(
    userId: string,
    feature: string,
    executor: () => Promise<T>,
    opts: { scopeId?: string; dedup?: boolean } = {},
  ): Promise<{ result: T; deduped: boolean }> {
    const key = this.keyOf(userId, feature, opts.scopeId ?? '');
    const dedupEnabled = opts.dedup !== false;
    const existing = this.inFlight.get(key);

    if (dedupEnabled) {
      if (existing) {
        if (!existing.done) {
          // 并发去重：搭车同一次调用
          this.logger.debug(`AI 调用并发去重：${key}`);
          return { result: (await existing.promise) as T, deduped: true };
        }
        if (Date.now() - existing.startedAt < AiIdempotencyService.DEDUP_WINDOW_MS) {
          // 短窗口内重复触发：直接复用上次结果
          this.logger.debug(`AI 调用结果复用：${key}`);
          return { result: existing.result as T, deduped: true };
        }
      }
    }

    const entry: InFlightEntry<T> = {
      promise: Promise.resolve() as Promise<T>,
      startedAt: Date.now(),
      done: false,
    };
    const promise = (async () => {
      const result = await executor();
      entry.done = true;
      entry.result = result;
      return result;
    })();
    entry.promise = promise;
    this.inFlight.set(key, entry as InFlightEntry<unknown>);
    this.cleanupIfNeeded();

    const result = await promise;
    return { result, deduped: false };
  }

  private cleanupIfNeeded() {
    if (this.inFlight.size < AiIdempotencyService.MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of this.inFlight) {
      if (entry.done && now - entry.startedAt > AiIdempotencyService.DEDUP_WINDOW_MS) {
        this.inFlight.delete(key);
      }
      if (this.inFlight.size < AiIdempotencyService.MAX_ENTRIES / 2) break;
    }
  }
}