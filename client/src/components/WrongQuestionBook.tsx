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
import { aiApi, questionBankApi, wrongQuestionApi } from '@client/src/api';
import CompanionDialog from '@client/src/components/CompanionDialog';
import { useAccount } from '@client/src/hooks/useAccount';
import { generateVariant } from '@client/src/utils/variant';
import type {
  ExplainResult,
  QuestionBankItem,
  WrongQuestionDTO,
} from '@shared/api.interface';

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
  const [recommends, setRecommends] = useState<QuestionBankItem[] | null>(null);
  const [recommending, setRecommending] = useState<boolean>(false);
  // 引导式讲题
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [explaining, setExplaining] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  // AI 陪伴
  const [companionOpen, setCompanionOpen] = useState<boolean>(false);
  const [companionWqId, setCompanionWqId] = useState<string | undefined>(undefined);

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
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={
                  item.status === 'mastered'
                    ? 'secondary'
                    : item.status === 'corrected'
                      ? 'default'
                      : 'outline'
                }
              >
                {item.status === 'mastered'
                  ? '已掌握'
                  : item.status === 'corrected'
                    ? '复习中'
                    : '待订正'}
              </Badge>
              {item.nextReviewAt ? (
                <span className="text-xs text-muted-foreground">
                  第 {item.reviewStage + 1} 轮 ·{' '}
                  {new Date(item.nextReviewAt) <= new Date()
                    ? '今天待复习'
                    : `${new Date(item.nextReviewAt).toLocaleDateString('zh-CN')} 复习`}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={recommending}
              onClick={async () => {
                setRecommending(true);
                try {
                  // 题库优先（同学科同知识点），不足时 AI 生成补齐并入库
                  const list = await questionBankApi.recommend({
                    subject: item.subject,
                    knowledgePoint: item.knowledgePoint || item.chapter || item.subject,
                    chapter: item.chapter,
                    count: 3,
                  });
                  if (list.length === 0) {
                    // 题库与 AI 均无结果时，退回本地规则版
                    const text = generateVariant(item.title);
                    if (text) {
                      setVariant({ id: item.id, text });
                    } else {
                      toast('该知识点暂无题目，可在后台录题或配置 AI_API_KEY');
                    }
                    return;
                  }
                  setRecommends(list);
                } catch (error) {
                  toast.error('推荐失败，请重试');
                } finally {
                  setRecommending(false);
                }
              }}
            >
              {recommending ? '推荐中…' : '举一反三'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCompanionWqId(item.id);
                setCompanionOpen(true);
              }}
            >
              小引陪练
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={explaining}
              onClick={async () => {
                setExplaining(true);
                setShowDetail(false);
                try {
                  const result = await aiApi.explain({
                    subject: item.subject,
                    title: item.title,
                    knowledgePoint: item.knowledgePoint,
                    wrongReason: item.reason,
                  });
                  setExplain(result);
                } catch (error) {
                  toast.error('讲解加载失败');
                } finally {
                  setExplaining(false);
                }
              }}
            >
              {explaining ? '加载中…' : '听讲解'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const text = generateVariant(item.title);
                if (!text) {
                  toast('该题不适合自动变式，建议老师人工出题');
                  return;
                }
                setVariant({ id: item.id, text });
              }}
            >
              快速变式
            </Button>
            {isStudent && item.status === 'open' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await wrongQuestionApi.markCorrected(item.id);
                  toast.success('已标记订正，已进入复习排期');
                  await load();
                }}
              >
                标记已订正
              </Button>
            ) : null}
            {isStudent && item.nextReviewAt ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await wrongQuestionApi.reviewDone(item.id);
                    toast.success('本轮复习完成，已排下一轮');
                    await load();
                  }}
                >
                  完成复习
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await wrongQuestionApi.reviewSkip(item.id);
                    toast.success('已跳过本轮，稍后提醒');
                    await load();
                  }}
                >
                  跳过本轮
                </Button>
              </>
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

      <CompanionDialog
        open={companionOpen}
        onOpenChange={setCompanionOpen}
        wrongQuestionId={companionWqId}
      />

      <Dialog
        open={!!explain}
        onOpenChange={(openFlag: boolean) => {
          if (!openFlag) {
            setExplain(null);
            setShowDetail(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>引导式讲解</DialogTitle>
          </DialogHeader>
          {explain ? (
            <div className="flex flex-col gap-3">
              {!explain.available ? (
                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  AI 讲解未启用（未配置 AI_API_KEY），以下为通用学习建议。
                </p>
              ) : null}
              {explain.steps.map((step, index) => {
                // 引导式交互：explain 段默认折叠，先自己想一想
                if (step.phase === 'explain' && !showDetail) return null;
                return (
                  <div key={index} className="rounded-lg border p-3 text-sm">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      {step.phase === 'read'
                        ? '审题要点'
                        : step.phase === 'hint'
                          ? '思路提示'
                          : '分步讲解'}
                    </p>
                    <p className="whitespace-pre-wrap">{step.text}</p>
                  </div>
                );
              })}
              {explain.available && explain.steps.some((s) => s.phase === 'explain') ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowDetail((prev) => !prev)}
                >
                  {showDetail ? '收起讲解，自己再想想' : '查看分步讲解'}
                </Button>
              ) : null}
              {explain.similarTip ? (
                <p className="text-xs text-muted-foreground">{explain.similarTip}</p>
              ) : null}
              {explain.encouragement ? (
                <p className="text-xs text-primary">{explain.encouragement}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!recommends}
        onOpenChange={(openFlag: boolean) => {
          if (!openFlag) setRecommends(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举一反三 · 同类题推荐</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {recommends?.map((question) => (
              <div key={question.id} className="rounded-lg border p-3 text-sm">
                <p>{question.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {question.source === 'ai' ? 'AI 生成（已入库）' : '题库精选'} ·{' '}
                  {question.difficulty === 'easy'
                    ? '基础'
                    : question.difficulty === 'hard'
                      ? '挑战'
                      : '中等'}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            来源：优先匹配题库（同学科同知识点），题库不足时 AI 生成并自动入库，越用越准。
          </p>
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
