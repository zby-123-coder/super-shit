import { useState } from 'react';
import { Link } from 'lucide-react';
import { toast } from 'sonner';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
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
import { supportApi } from '@client/src/api';
import AiWaitingHint from '@client/src/components/AiWaitingHint';
import type { SupportAskResponse } from '@shared/api.interface';

const REGIONS = ['北京', '浙江', '广东', '山东', '甘肃'];

/**
 * 智能客服 · 中考/高考政策问答。
 *
 * 设计要点（与平台 AI 交互规范一致）：
 *   1. 用户点击才请求：输入问题点「提问」才调 AI，不自动触发
 *   2. 等待可感知：AiWaitingHint 阶段提示
 *   3. 诚实展示：refused 转人工、provider 标注（llm=真实模型 / rule=规则版）、
 *      来源条目可回指（官方来源 URL 供人工核验）
 *   4. 反馈闭环：👍👎 记为 trace event（Langfuse score），帮助运营发现坏答案
 */
const SupportPage = () => {
  const [question, setQuestion] = useState('');
  const [region, setRegion] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SupportAskResponse | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const ask = async () => {
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await supportApi.ask({
        question: text,
        ...(region !== 'all' ? { region } : {}),
      });
      setResult(res);
      if (res.deduped) toast.info('刚问过这个问题，已复用刚才的结果（没有重复调用 AI）');
    } catch (error) {
      toast.error((error as Error).message || '提问失败');
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (rating: 'up' | 'down') => {
    if (!result?.callId || feedback) return;
    setFeedback(rating);
    try {
      await supportApi.feedback({ callId: result.callId, rating });
      toast.success(rating === 'up' ? '感谢反馈' : '已记录，我们会改进');
    } catch (error) {
      toast.error((error as Error).message || '反馈失败');
      setFeedback(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <PageHeader
        title="智能客服 · 政策问答"
        subtitle="中考/高考报名、时间、选科、志愿——回答只依据知识库并注明来源"
      />

      {/* 提问框：点击才请求 */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Input
              value={question}
              placeholder="例如：高考报名是什么时候？"
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void ask();
              }}
            />
            <Button size="sm" onClick={() => void ask()} disabled={loading || !question.trim()}>
              提问
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">省份（可选）：</span>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-8 w-28" aria-label="选择省份">
                <SelectValue placeholder="不限" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">不限</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-4">
            <AiWaitingHint active variant="chat" phases={['正在检索知识库…', '在核对条目来源…', '组织回答中…']} />
          </CardContent>
        </Card>
      ) : null}

      {result && !loading ? (
        <Card className={result.refused ? 'border-amber-200 bg-amber-50/60' : ''}>
          <CardContent className="flex flex-col gap-3 p-4">
            {result.refused ? (
              <p className="text-sm leading-relaxed text-amber-900">{result.answer}</p>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
            )}

            {/* 来源：可回指知识库条目，官方来源供人工核验 */}
            {result.sources.length > 0 ? (
              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Link className="size-3" /> 回答依据（{result.sources.length} 条）
                </p>
                {result.sources.map((s) => (
                  <div key={s.entryId} className="flex flex-col gap-0.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
                    <span className="text-xs font-medium">{s.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {s.stage === 'gaokao' ? '高考' : '中考'} · {s.region}
                      {s.source ? ` · 来源：${s.source}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* 反馈 + 诚实标注 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {result.provider === 'llm' ? '真实模型回答' : '规则版回答（建议人工确认）'}
              </span>
              {!result.refused ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant={feedback === 'up' ? 'default' : 'outline'}
                    className="size-7"
                    disabled={feedback !== null}
                    onClick={() => void sendFeedback('up')}
                    aria-label="有帮助"
                  >
                    <ThumbsUp className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant={feedback === 'down' ? 'default' : 'outline'}
                    className="size-7"
                    disabled={feedback !== null}
                    onClick={() => void sendFeedback('down')}
                    aria-label="没帮助"
                  >
                    <ThumbsDown className="size-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!result && !loading ? <EmptyBlock text="输入问题开始提问。回答只依据知识库条目，库里没有的会明确转人工，不会编造。" /> : null}
    </div>
  );
};

export default SupportPage;
