import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { reportApi } from '@client/src/api';
import type { WeeklyReport } from '@shared/api.interface';

/** 家长/学生端的本周学习报告入口：生成结论 + 一键复制分享 */
const WeeklyReportCard = ({
  studentUserId,
}: {
  studentUserId?: string;
}) => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await reportApi.weekly(studentUserId);
      setReport(result);
      setOpen(true);
    } catch (error) {
      toast.error('生成报告失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.text);
      toast.success('报告已复制，可粘贴分享给家人');
    } catch (error) {
      toast.error('复制失败，请手动选择文本');
    }
  };

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">本周学习报告</p>
              <p className="text-xs text-muted-foreground">
                自动汇总打卡、课时与进度
              </p>
            </div>
          </div>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? '生成中…' : '生成'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{report?.studentName} 学习周报</DialogTitle>
          </DialogHeader>
          {report ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-lg font-semibold">
                    {report.stats.taskApproved}/{report.stats.taskTotal}
                  </p>
                  <p className="text-[11px] text-muted-foreground">任务通过</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-lg font-semibold">
                    {report.stats.totalMinutes}
                  </p>
                  <p className="text-[11px] text-muted-foreground">学习分钟</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-lg font-semibold">
                    {report.stats.remainingLessons}
                  </p>
                  <p className="text-[11px] text-muted-foreground">剩余课时</p>
                </div>
              </div>
              {report.sections.map((section) => (
                <div key={section.title}>
                  <p className="text-sm font-medium">{section.title}</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {section.lines.map((line, index) => (
                      <li key={`${section.title}-${index}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <Button onClick={copyText}>复制报告文本分享</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeeklyReportCard;
