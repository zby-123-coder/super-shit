import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useAccount } from '@client/src/hooks/useAccount';
import { LoadingBlock } from '@client/src/components/PageShell';

const AdminLayout = () => {
  const { data, loading } = useAccount();

  if (loading) return <LoadingBlock />;
  if (data?.profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div>
          <p className="text-sm font-semibold">家教团队管理后台</p>
          <p className="text-xs text-muted-foreground">
            用户 · 教务 · 内容 · 数据概览
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <ArrowLeft />
            返回移动端
          </Link>
        </Button>
      </header>
      <div className="flex">
        <aside className="hidden w-48 shrink-0 border-r bg-background p-3 md:block">
          <NavLink
            to="/admin"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `block rounded-lg px-3 py-2 text-sm ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`
            }
          >
            数据概览
          </NavLink>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
