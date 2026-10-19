import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Progress } from '@client/src/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { progressApi } from '@client/src/api';
import DiagnosisCard from '@client/src/components/DiagnosisCard';
import { useAccount } from '@client/src/hooks/useAccount';
import type { ProgressDTO } from '@shared/api.interface';

const ProgressPage = () => {
  const { data } = useAccount();
  const role = data?.profile?.role ?? 'student';
  const isStaff = role === 'teacher' || role === 'admin';
  const [target, setTarget] = useState<string>('');
  const [items, setItems] = useState<ProgressDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{
    studentUserId: string;
    subject: string;
    chapter: string;
    percent: string;
    currentPoint: string;
  }>({
    studentUserId: '',
    subject: '',
    chapter: '',
    percent: '',
    currentPoint: '',
  });

  const canPick = role === 'parent' || isStaff;

  const load = useCallback(async () => {
    // 家长/老师未选择学生时不请求，避免越权 403 噪声
    if (canPick && !target) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await progressApi.list(target || undefined);
      setItems(result);
    } catch (error) {
      toast.error('学习进度加载失败');
    } finally {
      setLoading(false);
    }
  }, [target, canPick]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open && data?.students[0] && !form.studentUserId) {
      setForm((prev) => ({
        ...prev,
        studentUserId: data.students[0].userId,
      }));
    }
  }, [open, data, form.studentUserId]);

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

  const save = async () => {
    if (!form.studentUserId || !form.subject || !form.chapter) {
      toast.error('请填写学生、科目与章节');
      return;
    }
    try {
      await progressApi.save({
        studentUserId: form.studentUserId,
        subject: form.subject,
        chapter: form.chapter,
        percent: Number(form.percent) || 0,
        currentPoint: form.currentPoint,
      });
      toast.success('学习进度已更新');
      setOpen(false);
      setForm({
        studentUserId: form.studentUserId,
        subject: '',
        chapter: '',
        percent: '',
        currentPoint: '',
      });
      await load();
    } catch (error) {
      toast.error('保存失败，请重试');
    }
  };

  return (
    <>
      <DiagnosisCard studentUserId={target || undefined} />
      <div>
      <PageHeader
        title="学习进度"
        subtitle={isStaff ? '更新学员章节完成度' : '按科目查看章节完成情况'}
        action={
          isStaff ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              更新进度
            </Button>
          ) : canPick && candidates.length > 0 ? (
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
        {loading ? <LoadingBlock /> : null}
        {!loading && items.length === 0 ? (
          <EmptyBlock
            text={canPick && !target ? '请先在上方选择学生' : '暂无学习进度记录'}
          />
        ) : null}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {item.subject} · {item.chapter}
                </span>
                <span className="text-sm font-semibold">{item.percent}%</span>
              </div>
              <Progress className="mt-2" value={item.percent} />
              <p className="mt-2 text-xs text-muted-foreground">
                {item.currentPoint
                  ? `当前知识点：${item.currentPoint}`
                  : '暂未记录知识点'}
                {' · '}
                {dayjs(item.updatedAt).format('YYYY-MM-DD')} 更新
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新学习进度</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={form.studentUserId}
              onValueChange={(value: string) =>
                setForm((prev) => ({ ...prev, studentUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择学生">
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {(data?.students ?? []).map((student) => (
                  <SelectItem key={student.userId} value={student.userId}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="科目，如 数学"
              aria-label="科目"
            />
            <Input
              value={form.chapter}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chapter: event.target.value }))
              }
              placeholder="章节，如 第 3 章 函数"
              aria-label="章节"
            />
            <Input
              value={form.percent}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, percent: event.target.value }))
              }
              placeholder="完成百分比 0-100"
              aria-label="完成百分比"
            />
            <Input
              value={form.currentPoint}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, currentPoint: event.target.value }))
              }
              placeholder="当前知识点（选填）"
              aria-label="当前知识点"
            />
          </div>
          <DialogFooter>
            <Button onClick={save}>保存进度</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default ProgressPage;
