import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, MessageSquare, Plus, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyBlock, PageHeader } from '@client/src/components/PageShell';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { companionApi, wrongQuestionApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import { formatAiTime } from '@client/src/utils/ai-cache';
import type {
  CompanionMemoryDTO,
  CompanionMessageDTO,
  CompanionSessionDTO,
  WrongQuestionDTO,
} from '@shared/api.interface';

const STAGE_LABEL: Record<string, string> = {
  understand: '了解卡点',
  guide: '给提示',
  consolidate: '巩固方法',
  close: '收尾',
};

const STAGES = ['understand', 'guide', 'consolidate', 'close'];

/**
 * 小引 · 学习陪练（独立产品页）。
 *
 * 设计要点：
 *   1. 一级入口：底部导航直达，不再藏在错题本深处
 *   2. 历史可见：所有会话列表（题目标题 + 阶段 + 消息数 + 最后活跃时间），可续聊
 *   3. 每题一个会话：带 ?wq=<错题id> 进入即定位该题会话（后端自动复用，不重复调用 AI）
 *   4. 记忆可见：小引记得什么（薄弱点/进度/事实），让学生感知"它认识我"
 */
const CompanionPage = () => {
  const { data: account } = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetQuestionId = searchParams.get('wq') ?? '';

  const role = account?.profile?.role ?? 'student';
  const isParent = role === 'parent';
  const children = account?.students ?? [];
  // 学生看自己；家长看选中的孩子（后端已校验只能看自己孩子）
  const [selectedChild, setSelectedChild] = useState('');
  const studentUserId = isParent ? selectedChild || children[0]?.userId || '' : account?.profile?.userId ?? '';
  const [sessions, setSessions] = useState<CompanionSessionDTO[]>([]);
  const [memory, setMemory] = useState<CompanionMemoryDTO[]>([]);
  const [questions, setQuestions] = useState<WrongQuestionDTO[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<CompanionMessageDTO[]>([]);
  const [stage, setStage] = useState<string>('understand');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadSideData = useCallback(async () => {
    if (!studentUserId) return;
    const [s, m, q] = await Promise.all([
      companionApi.sessions(studentUserId).catch(() => []),
      companionApi.memory(studentUserId).catch(() => []),
      wrongQuestionApi.list(studentUserId).catch(() => []),
    ]);
    setSessions(s);
    setMemory(m);
    setQuestions(q);
  }, [studentUserId]);

  useEffect(() => {
    void loadSideData();
  }, [loadSideData]);

  // 打开某个历史会话
  const openSession = useCallback(async (id: string) => {
    setActiveId(id);
    const list = await companionApi.messages(id);
    setMessages(list);
    const hit = sessions.find((s) => s.id === id);
    if (hit) setStage(hit.stage);
  }, [sessions]);

  // 启动会话（带错题 id 时后端优先复用已有会话 → 不重复调用 AI）
  const startSession = useCallback(
    async (wrongQuestionId?: string) => {
      if (!studentUserId) return;
      setStarting(true);
      try {
        const res = await companionApi.start({
          studentUserId,
          ...(wrongQuestionId ? { wrongQuestionId } : {}),
        });
        setActiveId(res.session.id);
        setStage(res.session.stage);
        setMessages(res.messages);
        await loadSideData();
        if (res.resolved) {
          toast.info('已恢复这题的陪练记录（没有重复调用 AI）');
        }
      } catch (error) {
        toast.error((error as Error).message || '开启会话失败');
      } finally {
        setStarting(false);
      }
    },
    [studentUserId, loadSideData],
  );

  // 从错题本点「问小引」带 wq 参数进入 → 自动定位/创建该题会话
  useEffect(() => {
    if (!targetQuestionId || !studentUserId) return;
    void startSession(targetQuestionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetQuestionId, studentUserId]);

  const send = async () => {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setInput('');
    setSending(true);
    // 乐观上屏
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: text, stage, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await companionApi.send(activeId, text);
      setMessages(res.messages);
      setStage(res.session.stage);
      void loadSideData();
    } catch (error) {
      toast.error((error as Error).message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div className="flex flex-col gap-3 p-4">
      <PageHeader
        title={isParent ? '小引 · 孩子的陪练' : '小引 · 学习陪练'}
        subtitle={isParent ? '只读查看孩子的陪练记录与记忆' : '每道题一个会话，随时回来继续'}
      />

      {isParent ? (
        children.length > 1 ? (
          <Select value={studentUserId} onValueChange={setSelectedChild}>
            <SelectTrigger aria-label="选择孩子">
              <SelectValue placeholder="选择孩子" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.userId} value={c.userId}>
                  {c.name ?? c.userId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null
      ) : null}

        {/* 记忆卡 */}
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-violet-600" />
              <p className="text-sm font-medium">小引记得关于你的事</p>
            </div>
            {memory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                还没有记忆。和「小引」多聊几次、订正几道错题，它会自动记住你的薄弱点与进度。
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {memory.slice(0, 6).map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[11px] text-violet-900"
                  >
                    {item.kind === 'weakness' ? '薄弱点' : item.kind === 'progress' ? '进度' : '事实'}：
                    {item.content}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 开始新会话（家长端只读，隐藏创建入口） */}
        {!isParent ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">开始新的陪练</p>
                <Button size="sm" variant="outline" disabled={starting} onClick={() => void startSession()}>
                  <Plus className="mr-1 size-3.5" />
                  自由话题
                </Button>
              </div>
              {questions.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">从错题开始（每道题一个独立会话，可随时回来继续）</p>
                  {questions.slice(0, 5).map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      disabled={starting}
                      onClick={() => {
                        setSearchParams({ wq: q.id });
                      }}
                      className="truncate rounded-lg border px-3 py-2 text-left text-xs transition hover:bg-muted"
                    >
                      {q.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* 历史会话 */}
        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <p className="text-sm font-medium">历史会话（{sessions.length}）</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">还没有陪练记录。</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void openSession(s.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      activeId === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{s.topic || '学习引导'}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {s.messageCount ?? 0} 条 · {formatAiTime(new Date(s.lastActiveAt ?? s.createdAt).getTime())}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span
                        className={`rounded-full px-1.5 py-0.5 ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted'
                        }`}
                      >
                        {s.stageLabel}
                      </span>
                      <span>{s.status === 'active' ? '进行中' : '已结束'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 对话区 */}
        {activeId ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-600" />
                  <p className="text-sm font-medium">对话中</p>
                </div>
                <div className="flex gap-1">
                  {STAGES.map((s, i) => (
                    <span
                      key={s}
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        i <= stageIndex ? 'bg-violet-100 text-violet-800' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {STAGE_LABEL[s]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-muted'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {sending ? (
                  <div className="self-start rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    小引正在想…
                  </div>
                ) : null}
              </div>

              {isParent ? (
                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  家长端为只读视图：可以看孩子的陪练过程与小引的记忆，对话由孩子自己进行。
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    placeholder="说说你在哪一步卡住了…"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void send();
                    }}
                  />
                  <Button size="icon" onClick={() => void send()} disabled={sending || !input.trim()}>
                    <Send className="size-4" />
                  </Button>
                </div>
              )}
              <button
                type="button"
                className="self-start text-[11px] text-muted-foreground underline"
                onClick={() => navigate('/tasks')}
              >
                去错题本挑一道题 →
              </button>
            </CardContent>
          </Card>
        ) : (
          <EmptyBlock text="选择上面任意一个历史会话继续，或从错题开始新的陪练。" />
        )}
    </div>
  );
};

export default CompanionPage;