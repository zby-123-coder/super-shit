import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Bookmark } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Textarea } from '@client/src/components/ui/textarea';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { contentApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import type { ArticleDTO } from '@shared/api.interface';

const COLUMNS: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'case', label: '学生案例' },
  { value: 'trial', label: '试听' },
  { value: 'tour', label: '巡教行程' },
  { value: 'news', label: '学习资讯' },
];

const ContentPage = () => {
  const { data } = useAccount();
  const isAdmin = data?.profile?.role === 'admin';
  const [column, setColumn] = useState<string>('all');
  const [items, setItems] = useState<ArticleDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{
    title: string;
    columnType: string;
    summary: string;
    content: string;
    pinned: boolean;
  }>({ title: '', columnType: 'case', summary: '', content: '', pinned: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await contentApi.list(
        column === 'all' ? undefined : column,
      );
      setItems(result.items);
    } catch (error) {
      toast.error('内容加载失败');
    } finally {
      setLoading(false);
    }
  }, [column]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = async (item: ArticleDTO) => {
    try {
      const result = await contentApi.toggleFavorite(item.id);
      setItems((prev) =>
        prev.map((one) =>
          one.id === item.id ? { ...one, favorited: result.favorited } : one,
        ),
      );
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const publish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('标题与正文不能为空');
      return;
    }
    try {
      await contentApi.create({
        title: form.title.trim(),
        columnType: form.columnType as 'case' | 'trial' | 'tour' | 'news',
        summary: form.summary.trim(),
        content: form.content.trim(),
        pinned: form.pinned,
      });
      toast.success('内容已发布');
      setOpen(false);
      setForm({
        title: '',
        columnType: 'case',
        summary: '',
        content: '',
        pinned: false,
      });
      await load();
    } catch (error) {
      toast.error('发布失败，请重试');
    }
  };

  return (
    <div>
      <PageHeader
        title="发现"
        subtitle="学生案例、试听与巡教行程"
        action={
          isAdmin ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              发布内容
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2 overflow-x-auto border-b px-4 py-2">
        {COLUMNS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={column === item.value ? 'default' : 'ghost'}
            onClick={() => setColumn(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {loading ? <LoadingBlock /> : null}
        {!loading && items.length === 0 ? <EmptyBlock text="暂无内容" /> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/content/${item.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.summary || item.content.slice(0, 60)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.authorName} · {dayjs(item.createdAt).format('MM-DD')} ·{' '}
                  {item.readCount} 次阅读
                </p>
              </Link>
              <div className="flex flex-col items-end gap-1">
                {item.pinned ? <Badge variant="secondary">置顶</Badge> : null}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={item.favorited ? '取消收藏' : '收藏'}
                  onClick={() => toggleFavorite(item)}
                >
                  <Bookmark
                    className={item.favorited ? 'fill-primary text-primary' : ''}
                  />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布内容</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="标题"
              aria-label="标题"
            />
            <Select
              value={form.columnType}
              onValueChange={(value: string) =>
                setForm((prev) => ({ ...prev, columnType: value }))
              }
            >
              <SelectTrigger aria-label="栏目">
                <SelectValue placeholder="选择栏目" />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.filter((item) => item.value !== 'all').map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={form.summary}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, summary: event.target.value }))
              }
              placeholder="摘要（选填）"
              aria-label="摘要"
            />
            <Textarea
              className="min-h-32"
              value={form.content}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="正文内容"
              aria-label="正文"
            />
            <Button
              variant="ghost"
              onClick={() =>
                setForm((prev) => ({ ...prev, pinned: !prev.pinned }))
              }
            >
              {form.pinned ? '取消置顶' : '设为置顶'}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={publish}>发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentPage;
