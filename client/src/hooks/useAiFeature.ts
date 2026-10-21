import { useCallback, useEffect, useState } from 'react';
import { readAiCache, writeAiCache, type AiCacheEntry } from '@client/src/utils/ai-cache';

/**
 * 统一 AI 调用 Hook：**默认读缓存、主动点击才请求**。
 *
 * 用法：
 *   const ai = useAiFeature('diagnosis', studentUserId, () => reportApi.diagnosis(...));
 *   ai.data        // 上次结果（首次为空）
 *   ai.hasCache    // 是否有历史结果（前端据此显示"上次生成于 xx"）
 *   ai.run()       // 用户点击「生成/重新生成」时才真正发起请求
 *
 * 设计约束（对应产品诉求）：
 *   1. 组件挂载绝不自动调用 AI（useEffect 只读缓存，不发请求）
 *   2. 每次调用返回 callId + 写入本地缓存与调用历史
 *   3. 缓存按 userId 命名空间隔离
 */
export interface UseAiFeatureOptions<T> {
  /** 该功能是否允许自动执行（默认 false，即只在用户点击时调用） */
  auto?: boolean;
  /** 缓存 key 的作用域（同一功能不同对象分开缓存，如按错题 id） */
  scopeId?: string;
  /** 实际调用函数，需返回 { data, callId?, provider? } 或直接返回 data */
  fetcher: () => Promise<{ data: T; callId?: string | null; provider?: string } | T>;
}

export interface UseAiFeatureResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  hasCache: boolean;
  cachedAt: number | null;
  callId: string | null;
  provider: string;
  run: () => Promise<T | null>;
  reset: () => void;
}

const isEnvelope = <T,>(value: unknown): value is { data: T; callId?: string | null; provider?: string } =>
  typeof value === 'object' && value !== null && 'data' in (value as Record<string, unknown>);

export function useAiFeature<T>(
  userId: string,
  feature: string,
  options: UseAiFeatureOptions<T>,
): UseAiFeatureResult<T> {
  const { auto = false, scopeId = '', fetcher } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [provider, setProvider] = useState('unknown');

  // 只读缓存，不发请求
  useEffect(() => {
    const entry = readAiCache<T>(userId, feature, scopeId);
    if (entry) {
      setData(entry.data);
      setCachedAt(entry.at);
      setCallId(entry.callId);
      setProvider(entry.provider);
    } else {
      setData(null);
      setCachedAt(null);
      setCallId(null);
    }
  }, [userId, feature, scopeId]);

  const run = useCallback(async (): Promise<T | null> => {
    if (!userId) return null;
    setLoading(true);
    setError(null);
    const started = Date.now();
    try {
      const raw = await fetcher();
      const payload: { data: T; callId?: string | null; provider?: string } = isEnvelope<T>(raw)
        ? (raw as { data: T; callId?: string | null; provider?: string })
        : { data: raw as T };
      const providerName = payload.provider ?? 'unknown';
      const entry = writeAiCache<T>(userId, feature, scopeId, {
        callId: payload.callId ?? null,
        provider: providerName,
        data: payload.data,
      });
      setData(entry.data);
      setCachedAt(entry.at);
      setCallId(entry.callId);
      setProvider(entry.provider);
      return entry.data;
    } catch (e) {
      setError((e as Error).message || '调用失败');
      return null;
    } finally {
      setLoading(false);
      void started;
    }
    // fetcher 由调用方内联，用 ref 语义避免依赖抖动
  }, [userId, feature, scopeId, fetcher]);

  // 极少数场景显式开启自动调用（默认关闭）
  const autoRunRef = useCallback(() => {
    if (auto) void run();
  }, [auto, run]);
  useEffect(() => {
    autoRunRef();
  }, [autoRunRef]);

  const reset = useCallback(() => {
    setData(null);
    setCachedAt(null);
    setCallId(null);
    setProvider('unknown');
  }, []);

  return { data, loading, error, hasCache: cachedAt !== null, cachedAt, callId, provider, run, reset };
}

export default useAiFeature;