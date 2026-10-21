import { useCallback, useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@client/src/components/ui/dialog';
import { aiApi } from '@client/src/api';
import { cacheOwner, formatAiTime, readAiHistory, clearAiCacheOf } from '@client/src/utils/ai-cache';
import type { AiInvocationLogDTO } from '@shared/api.interface';

const FEATURE_LABEL: Record<string, string> = {
  diagnosis: '学情诊断',
  explain: '错题讲解',
  review_draft: '批阅评语',
  variant: '举一反三',
  grade_homework: '识图批改',
  companion: '小引对话',
  weekly: '周报润色',
  ops: '运营文案',
  insight: '状态洞察',
};

/**
 * 我的 AI 调用历史（服务端持久化 + 本地缓存双来源）。
 *
 * - 服务端 ai_invocation_log：跨设备可回看，含 callId / 时间 / 功能 / 耗时 / 提供方
 * - 本地缓存：即使服务端记录已清理，也能看到本机最近调用过的功能与时间
 * 数据按登录用户隔离：只看得到自己的记录。
 */
const AiHistoryPanel = ({ ownerUserId }: { ownerUserId?: string }) => {
  const owner = cacheOwner(ownerUserId);
  const [logs, setLogs] = useState<AiInvocationLogDTO[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [localItems, setLocalItems] = useState(readAiHistory(owner));
  const [detail, setDetail] = useState<AiInvocationLogDTO | null>(null);

  const load = useCallback(async () => {
    try {
      setLogs(await aiApi.logs({ limit: 20 }));
    } catch {
      // 未登录或网络异常时静默：本地历史仍可展示
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clearLocal = () => {
    clearAiCacheOf(owner);
    setLocalItems([]);
    toast.success('已清除本机 AI 缓存');
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <button
          type="button"
          className="flex items-center justify-between"
          onClick={() => {
            setExpanded((v) => !v);
            if (!expanded) void load();
          }}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <History className="size-4" />
            AI 调用记录
            <span className="text-[11px] font-normal text-muted-foreground">
              {logs.length > 0 ? `${logs.length} 条` : '暂无'}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{expanded ? '收起' : '展开'}</span>
        </button>

        {expanded ? (
          <div className="flex flex-col gap-2">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                还没有服务端调用记录。本机最近使用：
                {localItems.length === 0
                  ? '无'
                  : localItems.slice(0, 5).map((i) => FEATURE_LABEL[i.feature] ?? i.feature).join('、')}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {logs.map((log) => (
                  <button
                    key={log.callId}
                    type="button"
                    onClick={() => setDetail(log)}
                    className="rounded-lg border p-2.5 text-left text-xs transition hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{FEATURE_LABEL[log.feature] ?? log.feature}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatAiTime(new Date(log.createdAt).getTime())}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="rounded bg-muted px-1 py-0.5">call {log.callId.slice(0, 8)}</span>
                      <span>{log.provider}</span>
                      <span>{log.latencyMs}ms</span>
                      {log.status === 'degraded' ? (
                        <span className="text-orange-600">已降级规则版</span>
                      ) : null}
                    </div>
                    {log.preview ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{log.preview}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <Button size="sm" variant="ghost" className="self-start" onClick={clearLocal}>
              <Trash2 className="mr-1 size-3.5" />
              清除本机缓存
            </Button>
          </div>
        ) : null}

        {/* 完整结果回看 */}
        <Dialog open={!!detail} onOpenChange={(openFlag) => !openFlag && setDetail(null)}>
          <DialogContent className="max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detail ? FEATURE_LABEL[detail.feature] ?? detail.feature : ''} · 完整结果
              </DialogTitle>
            </DialogHeader>
            {detail ? (
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="rounded bg-muted px-1 py-0.5">call {detail.callId.slice(0, 8)}</span>
                  <span>{detail.provider}</span>
                  <span>{detail.latencyMs}ms</span>
                  <span>{formatAiTime(new Date(detail.createdAt).getTime())}</span>
                  {detail.status === 'degraded' ? <span className="text-orange-600">已降级规则版</span> : null}
                </div>
                {detail.full ? (
                  <pre className="whitespace-pre-wrap break-all rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
                    {detail.full}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">该次调用没有保存完整结果（更早的记录仅含摘要）。</p>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AiHistoryPanel;