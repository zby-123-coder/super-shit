/**
 * AI 结果本地缓存（按登录用户隔离）。
 *
 * 产品诉求对应：
 *   1. 每次 AI 调用后把结果缓存到本地，切页面/切设备回来先展示上次结果，不重算
 *   2. 只有用户主动点击才发起新调用（见 hooks/useAiFeature）
 *   3. 缓存/历史按 userId 命名空间隔离：换账号登录看不到别人的 AI 结果
 */

export interface AiCacheEntry<T = unknown> {
  /** 本地缓存 ID（与服务端 callId 对应，便于回看） */
  callId: string | null;
  /** 缓存写入时间 */
  at: number;
  feature: string;
  scopeId: string;
  provider: string;
  data: T;
}

export interface AiHistoryItem {
  callId: string | null;
  feature: string;
  scopeId: string;
  at: number;
  provider: string;
}

const NS = 'jj_ai_v1';
const HISTORY_LIMIT = 30;

const cacheKey = (userId: string, feature: string, scopeId: string) =>
  `${NS}:cache:${userId}:${feature}:${scopeId || '-'}`;

const historyKey = (userId: string) => `${NS}:history:${userId}`;

/** 登录用户 ID（来自 /api/account/me）；拿不到时返回空串，不允许跨用户读缓存 */
export const cacheOwner = (userId?: string | null): string => userId || 'anonymous';

export function readAiCache<T>(userId: string, feature: string, scopeId = ''): AiCacheEntry<T> | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId, feature, scopeId));
    return raw ? (JSON.parse(raw) as AiCacheEntry<T>) : null;
  } catch {
    return null;
  }
}

export function writeAiCache<T>(
  userId: string,
  feature: string,
  scopeId: string,
  payload: { callId?: string | null; provider?: string; data: T },
): AiCacheEntry<T> {
  const entry: AiCacheEntry<T> = {
    callId: payload.callId ?? null,
    at: Date.now(),
    feature,
    scopeId,
    provider: payload.provider ?? 'unknown',
    data: payload.data,
  };
  try {
    window.localStorage.setItem(cacheKey(userId, feature, scopeId), JSON.stringify(entry));
    pushHistory(userId, {
      callId: entry.callId,
      feature,
      scopeId,
      at: entry.at,
      provider: entry.provider,
    });
  } catch {
    // 隐私模式/超配额：缓存失败不影响功能
  }
  return entry;
}

export function removeAiCache(userId: string, feature: string, scopeId = '') {
  try {
    window.localStorage.removeItem(cacheKey(userId, feature, scopeId));
  } catch {
    // ignore
  }
}

/** 本地调用历史（最近 30 条，按用户隔离） */
export function readAiHistory(userId: string): AiHistoryItem[] {
  try {
    const raw = window.localStorage.getItem(historyKey(userId));
    return raw ? (JSON.parse(raw) as AiHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function pushHistory(userId: string, item: AiHistoryItem) {
  try {
    const list = readAiHistory(userId);
    const next = [item, ...list.filter((it) => !(it.feature === item.feature && it.scopeId === item.scopeId))]
      .slice(0, HISTORY_LIMIT);
    window.localStorage.setItem(historyKey(userId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** 退出登录时清空该用户的全部 AI 缓存（不留痕） */
export function clearAiCacheOf(userId: string) {
  try {
    const prefix = `${NS}:cache:${userId}:`;
    const history = `${NS}:history:${userId}`;
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix) || key === history)
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export const formatAiTime = (at: number): string => {
  const d = new Date(at);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};