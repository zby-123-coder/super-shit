import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { EmptyBlock, LoadingBlock } from '@client/src/components/PageShell';
import { wrongQuestionApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import { generateVariant } from '@client/src/utils/variant';
import type { WrongQuestionDTO } from '@shared/api.interface';

/** 错题本：学生录入与订正，家长/老师只读，支持数字变式 */
const WrongQuestionBook = () => {
  const { data } = useAccount();
  const role = data?.profile?.role ?? 'student';
  const isStudent = role === 'student';
  const [items, setItems] = useState<WrongQuestionDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{
    subject: string;
    chapter: string;
    title: string;
    reason: string;
    knowledgePoint: string;
  }>({
    subject: '数学',
    chapter: '',
    title: '',
    reason: '',
    knowledgePoint: '',
  });
  const [variant, setVariant] = useState<{ id: string; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await wrongQuestionApi.list());
    } catch (error) {
      toast.error('错题本加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error('请填写题干');
      return;
    }
    try {
      await wrongQuestionApi.create({
        subject: form.subject,
        chapter: form.chapter.trim(),
        title: form.title.trim(),
        reason: form.reason.trim(),
        knowledgePoint: form.knowledgePoint.trim(),
      });
      toast.success('已收入错题本');
      setOpen(false);
      setForm({ ...form, title: '', reason: '', knowledgePoint: '' });
      await load();
    } catch (error) {
      toast.error('保存失败，请重试');
    }
  };

  const openCount = items.filter((item) => item.status === 'open').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          共 {items.length} 题 · 待订正 {openCount}
        </span>
        {isStudent ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            ＋ 录入错题
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingBlock /> : null}
      {!loading && items.length === 0 ? (
        <EmptyBlock text="暂无错题，继续保持" />
      ) : null}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.subject}
                {item.chapter ? ` · ${item.chapter}` : ''}
                {item.reason ? ` · 错因：${item.reason}` : ''}
                {item.knowledgePoint ? ` · 考点：${item.knowledgePoint}` : ''}
              </p>
            </div>
            <Badge variant={item.status === 'corrected' ? 'secondary' : 'default'}>
              {item.status === 'corrected' ? '已订正' : '待订正'}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const text = generateVariant(item.title);
                if (!text) {
                  toast('该题不适合自动变式，建议老师人工出题');
                  return;
                }
                setVariant({ id: item.id, text });
              }}
            >
              生成变式题
            </Button>
            {isStudent && item.status === 'open' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await wrongQuestionApi.markCorrected(item.id);
                  toast.success('已标记订正');
                  await load();
                }}
              >
                标记已订正
              </Button>
            ) : null}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>录入错题</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="科目"
              aria-label="科目"
            />
            <Input
              value={form.chapter}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chapter: event.target.value }))
              }
              placeholder="章节（选填）"
              aria-label="章节"
            />
            <Textarea
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="题干"
              aria-label="题干"
            />
            <Input
              value={form.reason}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, reason: event.target.value }))
              }
              placeholder="错因（选填，如 计算粗心）"
              aria-label="错因"
            />
            <Input
              value={form.knowledgePoint}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  knowledgePoint: event.target.value,
                }))
              }
              placeholder="考点（选填）"
              aria-label="考点"
            />
          </div>
          <DialogFooter>
            <Button onClick={submit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!variant}
        onOpenChange={(openFlag: boolean) => {
          if (!openFlag) setVariant(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>变式练习</DialogTitle>
          </DialogHeader>
          <p className="text-sm">{variant?.text}</p>
          <p className="text-xs text-muted-foreground">
            规则版变式（数字等价替换）。后续可升级为 AI 生成更高质量的同类题。
          </p>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!variant) return;
                try {
                  await navigator.clipboard.writeText(variant.text);
                  toast.success('已复制');
                } catch (error) {
                  toast.error('复制失败');
                }
              }}
            >
              复制题目
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WrongQuestionBook;
