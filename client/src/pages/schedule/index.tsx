import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { courseApi } from '@client/src/api';
import { useAccount } from '@client/src/hooks/useAccount';
import type { CourseDTO, CourseWeekResponse } from '@shared/api.interface';

const SchedulePage = () => {
  const { data } = useAccount();
  const role = data?.profile?.role ?? 'student';
  const [offset, setOffset] = useState<number>(0);
  const [week, setWeek] = useState<CourseWeekResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const weekStartInput = useMemo<string | undefined>(() => {
    if (offset === 0) return undefined;
    return dayjs().add(offset * 7, 'day').toISOString();
  }, [offset]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await courseApi.getWeek(weekStartInput);
      setWeek(result);
    } catch (error) {
      toast.error('课程表加载失败');
    } finally {
      setLoading(false);
    }
  }, [weekStartInput]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo<{ day: string; items: CourseDTO[] }[]>(() => {
    if (!week) return [];
    const buckets: { day: string; items: CourseDTO[] }[] = [];
    week.items.forEach((item) => {
      const key = dayjs(item.startAt).format('YYYY-MM-DD');
      const found = buckets.find((bucket) => bucket.day === key);
      if (found) {
        found.items.push(item);
      } else {
        buckets.push({ day: key, items: [item] });
      }
    });
    return buckets;
  }, [week]);

  const handleConsume = async (item: CourseDTO) => {
    try {
      const result = await courseApi.consume(item.id);
      toast.success(`已消课，剩余 ${result.remaining} 课时`);
      await load();
    } catch (error) {
      toast.error('消课失败，请重试');
    }
  };

  const handleLeave = async (item: CourseDTO) => {
    try {
      await courseApi.updateStatus(item.id, { status: 'leave' });
      toast.success('已标记为请假');
      await load();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  const isStaff = role === 'teacher' || role === 'admin';

  return (
    <div>
      <PageHeader
        title="课程表"
        subtitle={
          week
            ? `${dayjs(week.weekStart).format('MM/DD')} - ${dayjs(
                week.weekEnd,
              ).format('MM/DD')}`
            : '本周安排'
        }
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="上一周"
              onClick={() => setOffset((prev) => prev - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(0)}
            >
              本周
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="下一周"
              onClick={() => setOffset((prev) => prev + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {loading ? <LoadingBlock /> : null}
        {!loading && grouped.length === 0 ? (
          <EmptyBlock text="本周暂无课程安排" />
        ) : null}
        {grouped.map((bucket) => (
          <div key={bucket.day} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {dayjs(bucket.day).format('M月D日')}
              </span>
              <span className="text-xs text-muted-foreground">
                {dayjs(bucket.day).format('dddd')}
              </span>
            </div>
            {bucket.items.map((item) => (
              <div key={item.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {dayjs(item.startAt).format('HH:mm')}-
                      {dayjs(item.endAt).format('HH:mm')} {item.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role === 'teacher'
                        ? `学生：${item.studentName}`
                        : `老师：${item.teacherName}`}
                      {item.location ? ` · ${item.location}` : ''}
                      {` · ${item.lessonCount} 课时`}
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
                {isStaff && item.status === 'pending' ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => handleConsume(item)}>
                      确认上课并消课
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLeave(item)}
                    >
                      标记请假
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulePage;
