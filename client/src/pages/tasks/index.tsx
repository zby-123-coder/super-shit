import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { taskApi } from '@client/src/api';
import {
  PRESET_COMMENTS,
  generateReviewDraft,
} from '@client/src/utils/review-draft';
import { useAccount } from '@client/src/hooks/useAccount';
import type { TaskDTO, TaskListResponse } from '@shared/api.interface';

const STATUS_TEXT: Record<TaskDTO['status'], string> = {
  open: '待完成',
  submitted: '已提交待批阅',
  approved: '已通过',
  rejected: '已退回',
};

const TasksPage = () => {
  const { data } = useAccount();
  const role = data?.profile?.role ?? 'student';
  const [tasks, setTasks] = useState<TaskListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkinTask, setCheckinTask] = useState<TaskDTO | null>(null);
  const [checkinContent, setCheckinContent] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const [reviewTask, setReviewTask] = useState<TaskDTO | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<{
    studentUserIds: string[];
    title: string;
    content: string;
    dueAt: string;
  }>({ studentUserIds: [], title: '', content: '', dueAt: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await taskApi.list();
      setTasks(result);
    } catch (error) {
      toast.error('任务列表加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitCheckin = async () => {
    if (!checkinTask) return;
    try {
      await taskApi.checkin(checkinTask.id, {
        content: checkinContent,
        durationMin: Number(duration) || 0,
      });
      toast.success('打卡成功，等待老师批阅');
      setCheckinTask(null);
      setCheckinContent('');
      await load();
    } catch (error) {
      toast.error('打卡失败，请重试');
    }
  };

  const submitReview = async (status: 'approved' | 'rejected') => {
    if (!reviewTask?.checkin) return;
    try {
      await taskApi.review(reviewTask.checkin.id, {
        status,
        comment: reviewComment,
      });
      toast.success(status === 'approved' ? '已通过' : '已退回重做');
      setReviewTask(null);
      setReviewComment('');
      await load();
    } catch (error) {
      toast.error('批阅失败，请重试');
    }
  };

  const submitCreate = async () => {
    if (newTask.studentUserIds.length === 0 || !newTask.title.trim()) {
      toast.error('请选择学生并填写任务标题');
      return;
    }
    try {
      const created = await taskApi.create({
        studentUserIds: newTask.studentUserIds,
        title: newTask.title.trim(),
        content: newTask.content.trim(),
        dueAt: newTask.dueAt ? new Date(newTask.dueAt).toISOString() : undefined,
      });
      toast.success(`已布置给 ${created.length} 名学生`);
      setCreateOpen(false);
      setNewTask({
        studentUserIds: newTask.studentUserIds,
        title: '',
        content: '',
        dueAt: '',
      });
      await load();
    } catch (error) {
      toast.error('布置任务失败，请重试');
    }
  };

  const isStaff = role === 'teacher' || role === 'admin';
  const pending = (tasks?.items ?? []).filter(
    (item) => item.status === 'submitted',
  );

  return (
    <div>
      <PageHeader
        title="学习任务"
        subtitle={
          isStaff
            ? `待批阅 ${pending.length} 个任务`
            : `待完成 ${tasks?.pendingCount ?? 0} · 连续打卡 ${
                tasks?.streakDays ?? 0
              } 天`
        }
        action={
          isStaff ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              布置任务
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {loading ? <LoadingBlock /> : null}
        {!loading && (tasks?.items.length ?? 0) === 0 ? (
          <EmptyBlock text="暂无学习任务" />
        ) : null}

        {(tasks?.items ?? []).map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {role === 'student'
                      ? `老师：${item.teacherName}`
                      : `学生：${item.studentName}`}
                    {item.subject ? ` · ${item.subject}` : ''}
                    {item.dueAt
                      ? ` · 截止 ${dayjs(item.dueAt).format('M月D日 HH:mm')}`
                      : ''}
                  </p>
                </div>
                <Badge
                  variant={
                    item.status === 'approved'
                      ? 'secondary'
                      : item.status === 'rejected'
                        ? 'destructive'
                        : 'default'
                  }
                >
                  {STATUS_TEXT[item.status]}
                </Badge>
              </div>

              {item.content ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.content}
                </p>
              ) : null}

              {item.checkin ? (
                <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs">
                  <p>
                    打卡内容：
                    {item.checkin.content || '（未填写文字）'}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    用时 {item.checkin.durationMin} 分钟 · 提交于{' '}
                    {dayjs(item.checkin.createdAt).format('M月D日 HH:mm')}
                  </p>
                  {item.checkin.reviewComment ? (
                    <p className="mt-1 text-primary">
                      老师评语：{item.checkin.reviewComment}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex gap-2">
                {role === 'student' && item.status !== 'approved' ? (
                  <Button size="sm" onClick={() => setCheckinTask(item)}>
                    {item.checkin ? '再次打卡' : '去打卡'}
                  </Button>
                ) : null}
                {isStaff && item.status === 'submitted' ? (
                  <Button size="sm" onClick={() => setReviewTask(item)}>
                    批阅
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!checkinTask}
        onOpenChange={(open: boolean) => {
          if (!open) setCheckinTask(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>任务打卡</DialogTitle>
            <DialogDescription>{checkinTask?.title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              value={checkinContent}
              onChange={(event) => setCheckinContent(event.target.value)}
              placeholder="记录今天的完成情况"
              aria-label="打卡内容"
            />
            <Input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="用时（分钟）"
              aria-label="用时"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitCheckin}>提交打卡</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reviewTask}
        onOpenChange={(open: boolean) => {
          if (!open) setReviewTask(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批阅打卡</DialogTitle>
            <DialogDescription>
              {reviewTask?.studentName} · {reviewTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              {PRESET_COMMENTS.map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setReviewComment(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setReviewComment(
                  generateReviewDraft({
                    content: reviewTask?.checkin?.content ?? '',
                    durationMin: reviewTask?.checkin?.durationMin ?? 0,
                    taskTitle: reviewTask?.title ?? '',
                  }),
                )
              }
            >
              生成草稿评语
            </Button>
          </div>
          <Textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="填写评语"
            aria-label="批阅评语"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => submitReview('rejected')}
            >
              退回重做
            </Button>
            <Button onClick={() => submitReview('approved')}>通过</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>布置学习任务</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                选择学生（已选 {newTask.studentUserIds.length}）
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setNewTask((prev) => ({
                    ...prev,
                    studentUserIds:
                      prev.studentUserIds.length ===
                      (data?.students ?? []).length
                        ? []
                        : (data?.students ?? []).map((item) => item.userId),
                  }))
                }
              >
                全选 / 反选
              </Button>
            </div>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {(data?.students ?? []).map((student) => {
                const checked = newTask.studentUserIds.includes(
                  student.userId,
                );
                return (
                  <label
                    key={student.userId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`选择学生 ${student.name}`}
                      onChange={() =>
                        setNewTask((prev) => ({
                          ...prev,
                          studentUserIds: checked
                            ? prev.studentUserIds.filter(
                                (id) => id !== student.userId,
                              )
                            : [...prev.studentUserIds, student.userId],
                        }))
                      }
                    />
                    {student.name}
                    {student.grade ? `（${student.grade}）` : ''}
                  </label>
                );
              })}
              {(data?.students ?? []).length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  暂无带班学生
                </span>
              ) : null}
            </div>
            <Input
              value={newTask.title}
              onChange={(event) =>
                setNewTask((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="任务标题，如 背诵《岳阳楼记》"
              aria-label="任务标题"
            />
            <Textarea
              value={newTask.content}
              onChange={(event) =>
                setNewTask((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="任务要求（选填）"
              aria-label="任务要求"
            />
            <Input
              value={newTask.dueAt}
              onChange={(event) =>
                setNewTask((prev) => ({ ...prev, dueAt: event.target.value }))
              }
              placeholder="截止时间，如 2026-10-20 20:00"
              aria-label="截止时间"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitCreate}>发布任务</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
