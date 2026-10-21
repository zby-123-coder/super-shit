import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { companionApi } from '@client/src/api';
import type { CompanionMessageDTO, CompanionSessionDTO } from '@shared/api.interface';

/**
 * AI 陪伴对话（引导师「小引」）。
 * 阶段条展示四段进度：了解卡点 → 给提示 → 巩固方法 → 收尾。
 * 规则版会明确标注"当前为脚本化引导"。
 */
const STAGES = [
  { key: 'understand', label: '了解卡点' },
  { key: 'guide', label: '给提示' },
  { key: 'consolidate', label: '巩固方法' },
  { key: 'close', label: '收尾' },
];

const CompanionDialog = ({
  open,
  onOpenChange,
  wrongQuestionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wrongQuestionId?: string;
}) => {
  const [session, setSession] = useState<CompanionSessionDTO | null>(null);
  const [messages, setMessages] = useState<CompanionMessageDTO[]>([]);
  const [input, setInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setSession(null);
    setStarting(true);
    companionApi
      .start({ wrongQuestionId })
      .then((result) => {
        setSession(result.session);
        setMessages(result.messages);
      })
      .catch((error: Error) => toast.error(error.message || '会话创建失败'))
      .finally(() => setStarting(false));
  }, [open, wrongQuestionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!session || !input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    // 乐观显示
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: 'user',
        content,
        stage: session.stage,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const result = await companionApi.send(session.id, content);
      setSession(result.session);
      setMessages((prev) => [...prev.filter((m) => !m.id.startsWith('local-')), ...result.messages]);
    } catch (error) {
      toast.error('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const currentStageIndex = session
    ? Math.max(0, STAGES.findIndex((s) => s.key === session.stage))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg">
        <DialogHeader>
          <DialogTitle>小引 · 引导式陪练</DialogTitle>
        </DialogHeader>

        {/* 阶段条 */}
        <div className="flex items-center gap-1">
          {STAGES.map((stage, index) => (
            <div
              key={stage.key}
              className={
                index <= currentStageIndex
                  ? 'flex-1 rounded-full bg-primary py-1 text-center text-[10px] text-primary-foreground'
                  : 'flex-1 rounded-full bg-muted py-1 text-center text-[10px] text-muted-foreground'
              }
            >
              {stage.label}
            </div>
          ))}
        </div>

        {/* 消息区 */}
        <div className="max-h-[45vh] min-h-[200px] overflow-y-auto rounded-lg border p-3">
          {starting ? (
            <p className="text-sm text-muted-foreground">小引正在准备…</p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? 'ml-8 self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                      : 'mr-8 self-start rounded-lg bg-muted px-3 py-2 text-sm'
                  }
                >
                  {message.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {session?.status === 'closed' ? (
          <p className="text-center text-xs text-muted-foreground">
            本次引导已结束。想继续练习，可重新发起会话。
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') send();
              }}
              placeholder="说出你的思路或卡点…"
              aria-label="对话输入"
              disabled={starting || sending}
            />
            <Button onClick={send} disabled={starting || sending || !input.trim()}>
              发送
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          小引不会直接给答案，会一步步引导你自己做出来。对话仅你本人、老师和家长可见。
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default CompanionDialog;
