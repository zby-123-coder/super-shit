import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { reportApi } from '@client/src/api';
import type { Diagnosis } from '@shared/api.interface';

/**
 * 学情诊断卡片（数据飞轮的「洞察」环节）。
 * 家长看孩子、老师看学生、学生看自己；样本不足时明确提示。
 */
const DiagnosisCard = ({ studentUserId }: { studentUserId?: string }) => {
  const [days, setDays] = useState<string>('30');
  const [data, setData] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportApi.diagnosis({
        studentUserId,
        days: Number(days),
      });
      setData(result);
    } catch (error) {
      toast.error('诊断加载失败');
    } finally {
      setLoading(false);
    }
  }, [days, studentUserId]);

  useEffect(() => {
    load();
  }, [load]);

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

        {loading ? (
          <p className="text-sm text-muted-foreground">分析中…</p>
        ) : data ? (
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

            <Button size="sm" variant="outline" onClick={load}>
              刷新诊断
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DiagnosisCard;
