import type { ReactNode } from 'react';

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <div className="flex items-start justify-between gap-2 border-b bg-background px-4 py-3">
    <div>
      <h1 className="text-base font-semibold">{title}</h1>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
);

export const LoadingBlock = ({ text = '加载中…' }: { text?: string }) => (
  <div className="p-8 text-center text-sm text-muted-foreground">{text}</div>
);

export const EmptyBlock = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
    {text}
  </div>
);
