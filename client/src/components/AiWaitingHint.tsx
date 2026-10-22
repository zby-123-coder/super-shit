import { useEffect, useState } from 'react';
import { ScanLine, Sparkles } from 'lucide-react';

export interface AiWaitingHintProps {
  /** 是否处于等待中 */
  active: boolean;
  /** 分阶段文案（每 2 秒切换一条，循环） */
  phases?: string[];
  /** 场景：vision 识图 / chat 文本 */
  variant?: 'vision' | 'chat';
}

const VISION_PHASES = [
  '正在读取作业图片…',
  'AI 正在逐题识别…',
  '判断对错、归类错因…',
  '生成批改建议…',
];

const CHAT_PHASES = ['AI 正在理解你的内容…', '组织语言中…', '马上就好…'];

/**
 * AI 等待提示：分阶段文案轮换 + 呼吸动画。
 *
 * 为什么需要：识图批改一次真实调用 3-5 秒（DeepSeek 视觉模型），
 * 干等一个转圈会让用户怀疑卡死；分阶段文案让"等待"变得可感知、可预期。
 */
const AiWaitingHint = ({ active, phases, variant = 'chat' }: AiWaitingHintProps) => {
  const list = phases ?? (variant === 'vision' ? VISION_PHASES : CHAT_PHASES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, list.length]);

  if (!active) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-2.5">
      <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
        {variant === 'vision' ? (
          <ScanLine className="size-3.5 animate-pulse text-violet-600" />
        ) : (
          <Sparkles className="size-3.5 animate-pulse text-violet-600" />
        )}
        <span className="absolute inset-0 animate-ping rounded-full bg-violet-200/60" />
      </span>
      <span key={index} className="animate-in fade-in text-xs text-violet-900 duration-300">
        {list[index]}
      </span>
      <span className="ml-0.5 flex gap-0.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1 animate-bounce rounded-full bg-violet-400"
            style={{ animationDelay: `${dot * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
};

export default AiWaitingHint;
