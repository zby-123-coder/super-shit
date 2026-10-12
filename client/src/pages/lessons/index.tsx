import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Progress } from '@client/src/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { courseApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import type { LessonSummaryResponse } from '@shared/api.interface';

const LessonsPage = () => {
  const { data } = useAccount();
  const role = data?.profile?.role ?? 'student';
  const [target, setTarget] = useState<string>('');
  const [summary, setSummary] = useState<LessonSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const canPick = role === 'parent' || role === 'teacher' || role === 'admin';

  const load = useCallback(async () => {
    // 家长/老师未选择学生时不请求，避免越权 403 噪声
    if (canPick && !target) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await courseApi.getLessons(target || undefined);
      setSummary(result);
    } catch (error) {
      toast.error('课时信息加载失败');
    } finally {
      setLoading(false);
    }
  }, [target, canPick]);

  useEffect(() => {
    load();
  }, [load]);

  const candidates = [
    ...(data?.children ?? []).map((item) => ({
      id: item.userId,
      label: `${item.name}（孩子）`,
    })),
    ...(data?.students ?? []).map((item) => ({
      id: item.userId,
      label: `${item.name}（学生）`,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="课时账本"
        subtitle={
          canPick ? '选择学生查看课时与消课流水' : '总购买、已消耗与剩余课时'
        }
        action={
          canPick && candidates.length > 0 ? (
            <Select
              value={target}
              onValueChange={(value: string) => setTarget(value)}
            >
              <SelectTrigger className="w-32" aria-label="选择学生">
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {canPick && !target && candidates.length > 0 ? (
          <EmptyBlock text="请先在上方选择要查看的学生" />
        ) : null}
        {loading ? <LoadingBlock /> : null}
        {!loading && (summary?.accounts.length ?? 0) === 0 ? (
          <EmptyBlock text="暂无课时账户" />
        ) : null}

        {(summary?.accounts ?? []).map((account) => (
          <Card key={account.subject} data-ai-section-type="card-stat">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{account.subject}</span>
                <span className="text-xs text-muted-foreground">
                  共 {account.totalLessons} · 已消耗 {account.usedLessons}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {account.remaining}
                <span className="ml-1 text-sm text-muted-foreground">
                  剩余课时
                </span>
              </p>
              <Progress
                className="mt-2"
                value={
                  account.totalLessons > 0
                    ? Math.round(
                        (account.usedLessons / account.totalLessons) * 100,
                      )
                    : 0
                }
              />
              {account.remaining <= account.alertThreshold ? (
                <p className="mt-2 text-xs text-warning">
                  剩余低于 {account.alertThreshold} 课时，建议及时续费
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">消课与增减流水</h2>
          {(summary?.ledgers.length ?? 0) === 0 ? (
            <EmptyBlock text="暂无流水记录" />
          ) : null}
          {(summary?.ledgers ?? []).map((ledger) => (
            <div
              key={ledger.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm">
                  {ledger.subject} ·{' '}
                  {ledger.changeType === 'consume'
                    ? '课程消课'
                    : ledger.changeType === 'purchase'
                      ? '课时发放'
                      : '手动调整'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayjs(ledger.createdAt).format('YYYY-MM-DD HH:mm')}
                  {ledger.remark ? ` · ${ledger.remark}` : ''}
                </p>
              </div>
              <span
                className={`text-sm font-medium ${
                  ledger.changeAmount > 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {ledger.changeAmount > 0 ? '+' : ''}
                {ledger.changeAmount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
