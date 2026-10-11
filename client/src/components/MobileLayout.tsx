import { NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Home,
  User,
} from 'lucide-react';
import { useAccount } from '@client/src/hooks/useAccount';

const TABS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/schedule', label: '课程表', icon: CalendarDays, end: false },
  { to: '/tasks', label: '任务', icon: CheckSquare, end: false },
  { to: '/content', label: '发现', icon: BookOpen, end: false },
  { to: '/me', label: '我的', icon: User, end: false },
];

const MobileLayout = () => {
  const { data, loading } = useAccount();

  if (!loading && !data?.profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen justify-center bg-muted/50">
      <div className="flex min-h-screen w-full max-w-[430px] flex-col bg-background">
        <div className="flex-1 pb-16">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              加载中…
            </div>
          ) : (
            <Outlet />
          )}
        </div>
        <nav className="sticky bottom-0 flex border-t bg-background/95 backdrop-blur">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }: { isActive: boolean }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <tab.icon className="size-5" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileLayout;
