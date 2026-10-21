import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { formatAiTime } from '@client/src/utils/ai-cache';

export interface AiActionBarProps {
  /** 是否正在调用 */
  loading: boolean;
  /** 本地是否有上次结果 */
  hasCache: boolean;
  cachedAt?: number | null;
  callId?: string | null;
  provider?: string;
  /** 无缓存时的按钮文案（如"生成诊断"） */
  label: string;
  /** 有缓存时的按钮文案 */
  reloadLabel?: string;
  onRun: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AI 主动触发条（所有 AI 能力统一用这个，保证交互一致）：
 *   - 没有缓存：主按钮"生成"，点了才调 AI
 *   - 有缓存：展示"上次生成时间 + callId + 提供方"，按钮变"重新生成"
 *   - 组件挂载不会自动调用（由 useAiFeature 保证）
 */
const AiActionBar = ({
  loading,
  hasCache,
  cachedAt,
  callId,
  provider,
  label,
  reloadLabel = '重新生成',
  onRun,
  disabled,
  className,
}: AiActionBarProps) => {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || disabled}
          onClick={onRun}
          className="relative overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              AI 思考中…
            </>
          ) : hasCache ? (
            <>
              <RotateCcw className="mr-1.5 size-3.5" />
              {reloadLabel}
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 size-3.5" />
              {label}
            </>
          )}
        </Button>

        {hasCache && cachedAt ? (
          <span className="text-[11px] text-muted-foreground">
            上次生成 {formatAiTime(cachedAt)}
            {callId ? ` · call ${callId.slice(0, 8)}` : ''}
            {provider && provider !== 'unknown' ? ` · ${provider}` : ''}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">点击后才会调用 AI，结果会缓存本地</span>
        )}
      </div>
    </div>
  );
};

export default AiActionBar;