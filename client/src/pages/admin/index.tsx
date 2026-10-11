import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { LoadingBlock } from '@client/src/components/PageShell';
import { adminApi, contentApi, courseApi, messageApi } from '@client/src/api';
import type {
  AdminOverview,
  AdminUserDTO,
  ArticleDTO,
  UserRole,
} from '@shared/api.interface';

const ROLE_LABEL: Record<UserRole, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
  admin: '管理员',
};

const toIso = (value: string): string => new Date(value.replace(' ', 'T')).toISOString();

const AdminPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [assignOpen, setAssignOpen] = useState<boolean>(false);
  const [assignForm, setAssignForm] = useState<{
    studentUserId: string;
    teacherUserId: string;
    parentUserId: string;
  }>({ studentUserId: '', teacherUserId: '', parentUserId: '' });

  const [courseOpen, setCourseOpen] = useState<boolean>(false);
  const [courseForm, setCourseForm] = useState<{
    studentUserId: string;
    teacherUserId: string;
    subject: string;
    startAt: string;
    endAt: string;
    location: string;
    lessonCount: string;
  }>({
    studentUserId: '',
    teacherUserId: '',
    subject: '数学',
    startAt: '',
    endAt: '',
    location: '',
    lessonCount: '1',
  });

  const [grantOpen, setGrantOpen] = useState<boolean>(false);
  const [grantForm, setGrantForm] = useState<{
    studentUserId: string;
    subject: string;
    amount: string;
  }>({ studentUserId: '', subject: '数学', amount: '10' });

  const [broadcastOpen, setBroadcastOpen] = useState<boolean>(false);
  const [broadcastForm, setBroadcastForm] = useState<{
    title: string;
    content: string;
    role: string;
  }>({ title: '', content: '', role: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, userData, articleData] = await Promise.all([
        adminApi.overview(),
        adminApi.users(),
        contentApi.listAll(),
      ]);
      setOverview(overviewData);
      setUsers(userData.items);
      setArticles(articleData.items);
    } catch (error) {
      toast.error('后台数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const students = users.filter((item) => item.role === 'student');
  const teachers = users.filter((item) => item.role === 'teacher');
  const parents = users.filter((item) => item.role === 'parent');

  const submitAssign = async () => {
    if (!assignForm.studentUserId) {
      toast.error('请选择学生');
      return;
    }
    try {
      await adminApi.assign({
        studentUserId: assignForm.studentUserId,
        teacherUserId: assignForm.teacherUserId || undefined,
        parentUserId: assignForm.parentUserId || undefined,
      });
      toast.success('绑定关系已更新');
      setAssignOpen(false);
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const submitCourse = async () => {
    if (!courseForm.studentUserId || !courseForm.startAt || !courseForm.endAt) {
      toast.error('请选择学生并填写上课时间');
      return;
    }
    try {
      await courseApi.create({
        studentUserId: courseForm.studentUserId,
        teacherUserId: courseForm.teacherUserId || undefined,
        subject: courseForm.subject,
        startAt: toIso(courseForm.startAt),
        endAt: toIso(courseForm.endAt),
        location: courseForm.location,
        lessonCount: Number(courseForm.lessonCount) || 1,
      });
      toast.success('课程已创建');
      setCourseOpen(false);
      await load();
    } catch (error) {
      toast.error('创建课程失败');
    }
  };

  const submitGrant = async () => {
    if (!grantForm.studentUserId || !grantForm.amount) {
      toast.error('请选择学生并填写课时数');
      return;
    }
    try {
      await courseApi.grant({
        studentUserId: grantForm.studentUserId,
        subject: grantForm.subject,
        amount: Number(grantForm.amount) || 0,
        remark: '后台发放课时',
      });
      toast.success('课时已发放');
      setGrantOpen(false);
    } catch (error) {
      toast.error('发放失败');
    }
  };

  const submitBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      toast.error('请填写通知标题与内容');
      return;
    }
    try {
      const result = await messageApi.broadcast({
        title: broadcastForm.title.trim(),
        content: broadcastForm.content.trim(),
        role: broadcastForm.role || undefined,
      });
      toast.success(`已发送给 ${result.count} 人`);
      setBroadcastOpen(false);
      setBroadcastForm({ title: '', content: '', role: '' });
    } catch (error) {
      toast.error('发送失败');
    }
  };

  const toggleStatus = async (item: ArticleDTO) => {
    try {
      await contentApi.setStatus(
        item.id,
        item.status === 'published' ? 'offline' : 'published',
      );
      toast.success('状态已更新');
      await load();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  if (loading) return <LoadingBlock />;

  const stats: { label: string; value: number | string }[] = [
    { label: '注册用户', value: overview?.userCount ?? 0 },
    { label: '学生', value: overview?.studentCount ?? 0 },
    { label: '老师', value: overview?.teacherCount ?? 0 },
    { label: '家长', value: overview?.parentCount ?? 0 },
    { label: '本周课程', value: overview?.weekCourseCount ?? 0 },
    { label: '待批阅打卡', value: overview?.pendingCheckinCount ?? 0 },
    { label: '已发布内容', value: overview?.articleCount ?? 0 },
    { label: '累计消耗课时', value: overview?.consumedLessons ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">团队运营后台</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setBroadcastOpen(true)}>
            群发通知
          </Button>
          <Button size="sm" onClick={() => setCourseOpen(true)}>
            新建课程
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setGrantOpen(true)}>
            发放课时
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">数据概览</TabsTrigger>
          <TabsTrigger value="users">用户与绑定</TabsTrigger>
          <TabsTrigger value="content">内容管理</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} data-ai-section-type="card-stat">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium">快速开始</p>
              <p className="mt-1 text-sm text-muted-foreground">
                1. 让老师/家长/学生首次打开应用时选择身份；
                2. 家长或老师用学生邀请码完成绑定，也可在「用户与绑定」里指派；
                3. 在移动端课表确认上课并消课，家长端课时账本会实时更新。
              </p>
              <Button size="sm" className="mt-3" onClick={() => setAssignOpen(true)}>
                指派老师 / 绑定家长
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">用户列表（{users.length}）</p>
                <Button size="sm" onClick={() => setAssignOpen(true)}>
                  指派关系
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {users.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm">
                        {item.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.grade || '未填年级'}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        邀请码 {item.inviteCode || '-'} · ID {item.userId.slice(0, 12)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.role}
                        onValueChange={async (value: string) => {
                          await adminApi.updateUser(item.id, {
                            role: value as UserRole,
                          });
                          toast.success('角色已更新');
                          await load();
                        }}
                      >
                        <SelectTrigger className="w-28" aria-label={`${item.name} 的角色`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABEL[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary">
                        {item.phone || '无手机号'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium">内容（{articles.length}）</p>
              <div className="flex flex-col gap-2">
                {articles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.authorName} · {item.readCount} 次阅读
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.status === 'published' ? 'default' : 'secondary'}
                      >
                        {item.status === 'published' ? '已发布' : '已下架'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(item)}>
                        {item.status === 'published' ? '下架' : '发布'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await contentApi.remove(item.id);
                          toast.success('已删除');
                          await load();
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>指派老师 / 绑定家长</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={assignForm.studentUserId}
              onValueChange={(value: string) =>
                setAssignForm((prev) => ({ ...prev, studentUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择学生">
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {students.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={assignForm.teacherUserId}
              onValueChange={(value: string) =>
                setAssignForm((prev) => ({ ...prev, teacherUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择老师">
                <SelectValue placeholder="选择任课老师（选填）" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={assignForm.parentUserId}
              onValueChange={(value: string) =>
                setAssignForm((prev) => ({ ...prev, parentUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择家长">
                <SelectValue placeholder="选择家长（选填）" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={submitAssign}>确认绑定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建课程</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={courseForm.studentUserId}
              onValueChange={(value: string) =>
                setCourseForm((prev) => ({ ...prev, studentUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择学生">
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {students.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={courseForm.teacherUserId}
              onValueChange={(value: string) =>
                setCourseForm((prev) => ({ ...prev, teacherUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择老师">
                <SelectValue placeholder="选择任课老师" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={courseForm.subject}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="科目"
              aria-label="科目"
            />
            <Input
              value={courseForm.startAt}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, startAt: event.target.value }))
              }
              placeholder="开始时间 2026-10-20 18:00"
              aria-label="开始时间"
            />
            <Input
              value={courseForm.endAt}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, endAt: event.target.value }))
              }
              placeholder="结束时间 2026-10-20 19:30"
              aria-label="结束时间"
            />
            <Input
              value={courseForm.location}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="地点 / 线上链接（选填）"
              aria-label="地点"
            />
            <Input
              value={courseForm.lessonCount}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, lessonCount: event.target.value }))
              }
              placeholder="消耗课时数"
              aria-label="课时数"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitCourse}>创建课程</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发放课时</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={grantForm.studentUserId}
              onValueChange={(value: string) =>
                setGrantForm((prev) => ({ ...prev, studentUserId: value }))
              }
            >
              <SelectTrigger aria-label="选择学生">
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {students.map((item) => (
                  <SelectItem key={item.userId} value={item.userId}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={grantForm.subject}
              onChange={(event) =>
                setGrantForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="科目"
              aria-label="发放科目"
            />
            <Input
              value={grantForm.amount}
              onChange={(event) =>
                setGrantForm((prev) => ({ ...prev, amount: event.target.value }))
              }
              placeholder="课时数"
              aria-label="课时数"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitGrant}>确认发放</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>群发站内通知</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={broadcastForm.title}
              onChange={(event) =>
                setBroadcastForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="通知标题"
              aria-label="通知标题"
            />
            <Input
              value={broadcastForm.content}
              onChange={(event) =>
                setBroadcastForm((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="通知内容"
              aria-label="通知内容"
            />
            <Select
              value={broadcastForm.role}
              onValueChange={(value: string) =>
                setBroadcastForm((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger aria-label="接收人群">
                <SelectValue placeholder="接收人群（选填）" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                  <SelectItem key={role} value={role}>
                    仅{ROLE_LABEL[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={submitBroadcast}>发送</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
