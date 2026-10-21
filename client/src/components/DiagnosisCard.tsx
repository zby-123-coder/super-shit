import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { reportApi } from '@client/src/api';
import { useAiFeature } from '@client/src/hooks/useAiFeature';
import AiActionBar from '@client/src/components/AiActionBar';
import { cacheOwner } from '@client/src/utils/ai-cache';
import type { Diagnosis } from '@shared/api.interface';

/**
 * 学情诊断卡片（数据飞轮的「洞察」环节）。
 * 家长看孩子、老师看学生、学生看自己；样本不足时明确提示。
 *
 * 交互约定：**绝不自动调用**——进页面只读本地缓存，
 * 展示上次结果（带生成时间与 callId），用户点「生成诊断/重新生成」才请求 AI。
 */
const DiagnosisCard = ({
  studentUserId,
  ownerUserId,
}: {
  studentUserId?: string;
  /** 缓存归属用户（登录人），保证按身份隔离 */
  ownerUserId?: string;
}) => {
  const [days, setDays] = useState<string>('30');
  const owner = cacheOwner(ownerUserId);

  const fetcher = useCallback(async () => {
    const result = await reportApi.diagnosis({ studentUserId, days: Number(days) });
    return { data: result as Diagnosis, provider: 'ai' };
  }, [days, studentUserId]);

  const ai = useAiFeature<Diagnosis>(owner, 'diagnosis', {
    scopeId: `${studentUserId || 'self'}:${days}`,
    fetcher,
  });

  const data = ai.data;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            学情诊断{data ? ` · ${data.studentName}` : ''}
          </p>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-28" aria-label="统计周期">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近 7 天</SelectItem>
              <SelectItem value="30">近 30 天</SelectItem>
              <SelectItem value="90">近 90 天</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AiActionBar
          loading={ai.loading}
          hasCache={ai.hasCache}
          cachedAt={ai.cachedAt}
          callId={ai.callId}
          provider={ai.provider}
          label="生成诊断"
          onRun={async () => {
            const result = await ai.run();
            if (!result) toast.error('诊断生成失败，请稍后重试');
          }}
        />

        {ai.error ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">生成失败：{ai.error}</p>
        ) : null}

        {data ? (
          <div className="flex flex-col gap-3">
            {!data.sampleSufficient ? (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                样本不足（当前 {data.sampleSize} 条记录，至少需要 5 条）：以下结论仅供参考，
                坚持打卡与错题订正后诊断会更准确。
              </p>
            ) : null}

            <p className="text-sm">{data.summary}</p>

            <div className="grid grid-cols-2 gap-2">
              {data.dimensions.map((dim) => (
                <div key={dim.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{dim.label}</span>
                    <span
                      className={
                        dim.score >= 80
                          ? 'text-sm font-bold text-green-600'
                          : dim.score < 60
                            ? 'text-sm font-bold text-orange-600'
                            : 'text-sm font-bold'
                      }
                    >
                      {dim.score}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className={
                        dim.score >= 80
                          ? 'h-full rounded-full bg-green-500'
                          : dim.score < 60
                            ? 'h-full rounded-full bg-orange-400'
                            : 'h-full rounded-full bg-primary'
                      }
                      style={{ width: `${Math.max(2, Math.min(100, dim.score))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{dim.detail}</p>
                </div>
              ))}
            </div>

            {data.prescriptions.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">提升处方</p>
                <div className="flex flex-col gap-2">
                  {data.prescriptions.map((item, index) => (
                    <div key={index} className="rounded-lg border p-3 text-sm">
                      <p>{item.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          !ai.loading && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                还没有诊断结果。点上方「生成诊断」调用 AI 分析，结果会缓存到本地，下次直接看。
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosisCard;
