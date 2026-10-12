import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Progress } from '@client/src/components/ui/progress';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import WeeklyReportCard from '@client/src/components/WeeklyReportCard';
import { courseApi, messageApi, taskApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import type {
  CourseDTO,
  CourseWeekResponse,
  LessonSummaryResponse,
  TaskListResponse,
  UserRole,
} from '@shared/api.interface';

const ROLE_LABEL: Record<UserRole, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
  admin: '管理员',
};

const HomePage = () => {
  const { data } = useAccount();
  const profile = data?.profile;
  const [week, setWeek] = useState<CourseWeekResponse | null>(null);
  const [tasks, setTasks] = useState<TaskListResponse | null>(null);
  const [lessons, setLessons] = useState<LessonSummaryResponse | null>(null);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const role: UserRole = profile?.role ?? 'student';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 逐项容错：任一接口失败不应让整页崩溃
      const [weekData, taskData, lessonData, messageData] = await Promise.all([
        courseApi.getWeek().catch(() => null),
        taskApi.list().catch(() => null),
        role === 'student' || role === 'admin'
          ? courseApi.getLessons().catch(() => null)
          : Promise.resolve(null),
        messageApi.list().catch(() => null),
      ]);
      setWeek(weekData);
      setTasks(taskData);
      setLessons(lessonData);
      setUnread(messageData?.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const todayCourses = useMemo<CourseDTO[]>(() => {
    if (!week) return [];
    const today = dayjs().format('YYYY-MM-DD');
    return week.items.filter((item) =>
      dayjs(item.startAt).format('YYYY-MM-DD') === today,
    );
  }, [week]);

  const remaining = useMemo<number>(() => {
    if (!lessons) return 0;
    return lessons.accounts.reduce(
      (sum: number, account) => sum + account.remaining,
      0,
    );
  }, [lessons]);

  const alertSubjects = useMemo<string[]>(() => {
    if (!lessons) return [];
    return lessons.accounts
      .filter((account) => account.remaining <= account.alertThreshold)
      .map((account) => account.subject);
  }, [lessons]);

  if (!profile || loading) {
    return <LoadingBlock />;
  }

  const quickLinks = [
    { to: '/schedule', label: '课程表', icon: CalendarDays },
    { to: '/tasks', label: '任务打卡', icon: CheckSquare },
    { to: '/lessons', label: '课时账本', icon: Clock },
    { to: '/progress', label: '学习进度', icon: TrendingUp },
  ];

  const isBlank =
    role !== 'admin' &&
    todayCourses.length === 0 &&
    (tasks?.items.length ?? 0) === 0;

  const childLabel =
    role === 'parent' && data?.children.length
      ? `${data.children[0].name} 的学习概览`
      : role === 'student'
        ? '今日学习概览'
        : role === 'teacher'
          ? '今日授课概览'
          : '团队运营概览';

  return (
    <div>
      <div className="page-hero">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {profile.name || '同学'}，你好
            </p>
            <p className="sub mt-1 truncate text-xs">
              {ROLE_LABEL[role]} · {childLabel}
            </p>
          </div>
          <Link to="/me" aria-label="消息中心">
            <Button
              size="sm"
              variant="ghost"
              className="relative shrink-0 bg-white/20 text-white hover:bg-white/30"
            >
              消息
              {unread > 0 ? (
                <Badge className="absolute -right-1 -top-1 px-1 text-[10px]">
                  {unread}
                </Badge>
              ) : null}
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {isBlank ? (
          <Card className="card-soft border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-2 p-4">
              <p className="text-sm font-medium">欢迎使用</p>
              <p className="text-xs text-muted-foreground">
                现在还是空白的。可以先加载一份演示数据，看看排课、消课、打卡、课时是怎么流转的。
              </p>
              <Button asChild size="sm" className="self-start">
                <Link to="/me">去「我的」加载演示数据</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border/70 bg-white p-3 text-xs shadow-[0_1px_3px_rgba(16,24,40,0.05)]"
            >
              <link.icon className="size-5 text-primary" />
              {link.label}
            </Link>
          ))}
        </div>

        {role === 'teacher' || role === 'admin' ? (
          <Card className="card-soft" data-ai-section-type="card-stat">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">待批阅打卡</p>
                <p className="text-2xl font-semibold">
                  {tasks?.pendingCount ?? 0}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/tasks">去处理</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {role === 'admin' ? (
          <Card className="card-soft" data-ai-section-type="card-stat">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">管理后台</p>
                <p className="text-sm">
                  用户 / 教务 / 内容 / 数据看板
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/admin">
                  <LayoutDashboard className="size-4" />
                  进入
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">今日课程</h2>
              <Link
                to="/schedule"
                className="text-xs text-primary"
                aria-label="查看完整课程表"
              >
                全部
              </Link>
            </div>
            {todayCourses.length === 0 ? (
              <EmptyBlock text="今天没有排课" />
            ) : (
              <div className="flex flex-col gap-2">
                {todayCourses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {dayjs(item.startAt).format('HH:mm')} {item.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role === 'teacher'
                          ? `学生：${item.studentName}`
                          : `老师：${item.teacherName}`}
                        {item.location ? ` · ${item.location}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === 'done'
                          ? 'secondary'
                          : item.status === 'leave'
                            ? 'destructive'
                            : 'default'
                      }
                    >
                      {item.status === 'done'
                        ? '已上'
                        : item.status === 'leave'
                          ? '请假'
                          : '待上'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {role !== 'admin' ? (
          <Card className="card-soft">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  {role === 'teacher' ? '任务概况' : '学习任务'}
                </h2>
                <Link to="/tasks" className="text-xs text-primary">
                  去打卡
                </Link>
              </div>
              {role === 'teacher' ? (
                <p className="text-sm text-muted-foreground">
                  已布置 {tasks?.items.length ?? 0} 个任务，待批阅{' '}
                  {tasks?.pendingCount ?? 0} 个
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-sm">
                    <span>待完成 {tasks?.pendingCount ?? 0}</span>
                    <span>已完成 {tasks?.doneCount ?? 0}</span>
                    <span>连续打卡 {tasks?.streakDays ?? 0} 天</span>
                  </div>
                  <Progress
                    className="mt-2"
                    value={
                      tasks && tasks.items.length > 0
                        ? Math.round(
                            (tasks.doneCount / tasks.items.length) * 100,
                          )
                        : 0
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        {role === 'student' || role === 'parent' ? (
          <WeeklyReportCard
            studentUserId={
              role === 'parent' ? data?.children[0]?.userId : undefined
            }
          />
        ) : null}

        {role === 'student' || role === 'parent' ? (
          <Card className="card-soft">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">课时余额</h2>
                <Link to="/lessons" className="text-xs text-primary">
                  明细
                </Link>
              </div>
              <p className="text-2xl font-semibold">
                {remaining}
                <span className="ml-1 text-sm text-muted-foreground">
                  剩余课时
                </span>
              </p>
              {alertSubjects.length > 0 ? (
                <p className="mt-1 text-xs text-warning">
                  {alertSubjects.join('、')} 课时不足，建议及时续费
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {role !== 'teacher' ? (
          <Link
            to="/content"
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <span className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 text-primary" />
              看看团队最新案例与试听内容
            </span>
            <span className="text-xs text-muted-foreground">去看看</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default HomePage;
