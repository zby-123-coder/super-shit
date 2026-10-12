import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Home,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAccount } from '@client/src/hooks/useAccount';
import { getToken, UNAUTHORIZED_EVENT } from '@client/src/utils/auth-token';
import DevFloatingSwitch from '@client/src/components/DevFloatingSwitch';

const BASE_TABS = {
  student: [
    ['home', '🏠', '首页'],
    ['schedule', '📅', '课表'],
    ['tasks', '✅', '任务'],
    ['lessons', '⏱', '课时'],
    ['progress', '📈', '进度'],
    ['content', '📖', '发现'],
    ['me', '👤', '我的'],
  ],
  parent: [
    ['home', '🏠', '首页'],
    ['schedule', '📅', '课表'],
    ['tasks', '✅', '学情'],
    ['lessons', '⏱', '课时'],
    ['progress', '📈', '进度'],
    ['content', '📖', '发现'],
    ['me', '👤', '我的'],
  ],
  teacher: [
    ['home', '🏠', '工作台'],
    ['schedule', '📅', '课表'],
    ['tasks', '✅', '批阅'],
    ['lessons', '⏱', '课时'],
    ['progress', '📈', '进度'],
    ['content', '📖', '发现'],
    ['me', '👤', '我的'],
  ],
  admin: [
    ['home', '🏠', '概览'],
    ['schedule', '📅', '课表'],
    ['tasks', '✅', '任务'],
    ['lessons', '⏱', '课时'],
    ['progress', '📈', '进度'],
    ['content', '📖', '内容'],
    ['me', '👤', '我的'],
  ],
} as const;

/** 仅本地开发环境追加身份切换入口 */
const isLocalDev =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const MobileLayout = () => {
  const { data, loading } = useAccount();
  const [signedIn, setSignedIn] = useState<boolean>(!!getToken());

  useEffect(() => {
    const onExpired = (): void => setSignedIn(false);
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, []);

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && !data?.profile) {
    return <Navigate to="/login" replace />;
  }

  const role = data?.profile?.role ?? 'student';
  const tabs: [string, string, string][] = [
    ...(BASE_TABS[role] as unknown as [string, string, string][]),
  ];
  if (isLocalDev) tabs.push(['dev', '🔧', '切换']);

  return (
    <div className="flex min-h-screen justify-center bg-muted/50">
      <div className="flex min-h-screen w-full max-w-[430px] flex-col bg-background">
        {isLocalDev ? <DevFloatingSwitch /> : null}
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
          {tabs.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to === 'home' ? '/' : `/${to}`}
              end={to === 'home'}
              className={({ isActive }: { isActive: boolean }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <span className="text-base leading-none">
                {to === 'dev' ? <RefreshCw className="size-4" /> : icon}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileLayout;
