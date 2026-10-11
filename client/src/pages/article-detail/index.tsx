import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { LoadingBlock } from '@client/src/components/PageShell';
import { contentApi } from '@client/src/api';
import type { ArticleDTO } from '@shared/api.interface';

const COLUMN_LABEL: Record<string, string> = {
  case: '学生案例',
  trial: '试听',
  tour: '巡教行程',
  news: '学习资讯',
};

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await contentApi.detail(id);
      setArticle(result);
    } catch (error) {
      toast.error('内容加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制，可分享给家长');
    } catch (error) {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

  if (loading) return <LoadingBlock />;
  if (!article) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        内容不存在或已下架
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="返回"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft />
        </Button>
        <span className="text-sm text-muted-foreground">
          {COLUMN_LABEL[article.columnType] ?? '内容'}
        </span>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={article.favorited ? '取消收藏' : '收藏'}
            onClick={async () => {
              const result = await contentApi.toggleFavorite(article.id);
              setArticle((prev) =>
                prev ? { ...prev, favorited: result.favorited } : prev,
              );
            }}
          >
            <Bookmark
              className={
                article.favorited ? 'fill-primary text-primary' : ''
              }
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="分享"
            onClick={handleShare}
          >
            <Share2 />
          </Button>
        </div>
      </div>

      <article className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold">{article.title}</h1>
        <p className="text-xs text-muted-foreground">
          {article.authorName} · {article.readCount} 次阅读
        </p>
        {article.summary ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm">
            {article.summary}
          </p>
        ) : null}
        <div className="whitespace-pre-wrap text-sm leading-6">
          {article.content}
        </div>
      </article>
    </div>
  );
};

export default ArticleDetailPage;
