import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
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
import { EmptyBlock, LoadingBlock, PageHeader } from '@client/src/components/PageShell';
import { useNavigate } from 'react-router-dom';
import {
  accountApi,
  authApi,
  demoApi,
  messageApi,
} from '@client/src/api';
import { refreshAccount, useAccount } from '@client/src/hooks/useAccount';
import { clearToken } from '@client/src/utils/auth-token';
import type { MessageDTO, UserRole } from '@shared/api.interface';

const ROLE_LABEL: Record<UserRole, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
  admin: '管理员',
};

const MePage = () => {
  const { data, reload } = useAccount();
  const navigate = useNavigate();
  const profile = data?.profile;
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [childOpen, setChildOpen] = useState<boolean>(false);
  const [childForm, setChildForm] = useState<{
    name: string;
    grade: string;
    loginName: string;
    password: string;
  }>({ name: '', grade: '', loginName: '', password: '' });
  const [studentCode, setStudentCode] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{
    role: UserRole;
    name: string;
    grade: string;
    subjectTags: string;
  }>({ role: 'student', name: '', grade: '', subjectTags: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const messageResult = await messageApi.list();
      setMessages(messageResult.items);
    } catch (error) {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (profile) {
      setForm({
        role: profile.role,
        name: profile.name,
        grade: profile.grade,
        subjectTags: profile.subjectTags,
      });
    }
  }, [profile]);

  if (!profile) return <LoadingBlock />;

  const submitChild = async () => {
    if (!childForm.name.trim() || !childForm.loginName.trim()) {
      toast.error('请填写孩子姓名与登录名');
      return;
    }
    try {
      await accountApi.createChild({
        loginName: childForm.loginName.trim(),
        password: childForm.password,
        name: childForm.name.trim(),
        grade: childForm.grade.trim(),
      });
      toast.success(`孩子「${childForm.name.trim()}」已加入家庭`);
      setChildOpen(false);
      setChildForm({ name: '', grade: '', loginName: '', password: '' });
      await reload();
    } catch (error) {
      toast.error('创建失败：登录名可能已被使用');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await accountApi.saveProfile({
        role: form.role,
        name: form.name.trim() || profile.name,
        grade: form.grade,
        subjectTags: form.subjectTags,
      });
      toast.success('资料已更新');
      setEditOpen(false);
      await reload();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  return (
    <div>
      <PageHeader
        title="我的"
        subtitle={`${ROLE_LABEL[profile.role]} · ${
          profile.grade ? `${profile.grade} · ` : ''
        }${profile.subjectTags || '未填写补充信息'}`}
        action={
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            编辑资料
          </Button>
        }
      />

      <div className="flex flex-col gap-3 p-4">
        <Card className="card-soft" data-ai-section-type="card-stat">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium">演示模式</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  一键体验完整产品效果，可随时清除
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      const result = await demoApi.seed();
                      if (result.created === 0) {
                        toast('已加载过演示数据，无需重复操作');
                      } else {
                        toast.success('演示数据已加载');
                      }
                      await reload();
                      navigate('/', { replace: true });
                    } catch (error) {
                      toast.error('加载失败，请重试');
                    } finally {
                      setSeeding(false);
                    }
                  }}
                >
                  {seeding ? '加载中…' : '加载演示数据'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await demoApi.clear();
                    toast.success('演示数据已清除');
                    await reload();
                  }}
                >
                  清除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-soft" data-ai-section-type="card-stat">
          <CardContent className="p-4">
            <p className="text-sm font-medium">{profile.name || '未命名'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              我的邀请码：
              <span className="font-semibold text-foreground">
                {profile.inviteCode || '-'}
              </span>
              （家长/老师输入它即可绑定）
            </p>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="self-start"
          onClick={async () => {
            try {
              await authApi.logout();
            } catch (error) {
              /* 会话已失效时直接清理本地 */
            }
            clearToken();
            navigate('/login', { replace: true });
          }}
        >
          退出登录
        </Button>

        {profile.role === 'admin' ? (
          <Link
            to="/admin"
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <span className="flex items-center gap-2 text-sm">
              <LayoutDashboard className="size-4 text-primary" />
              进入管理后台
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ) : null}

        {data?.family ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium">
                    家庭：{data.family.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    家庭邀请码：
                    <span className="font-semibold text-foreground">
                      {data.family.inviteCode}
                    </span>
                    （另一位家长注册时填写即可加入）
                  </p>
                </div>
                {profile.role === 'parent' ? (
                  <Button
                    size="sm"
                    onClick={() => setChildOpen(true)}
                  >
                    添加孩子
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {data.family.parents.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="secondary">
                        {member.userId === data.family?.ownerUserId
                          ? '户主'
                          : '家长'}
                      </Badge>
                    </div>
                    {member.userId === profile.userId ? (
                      <span className="text-xs text-muted-foreground">我</span>
                    ) : null}
                  </div>
                ))}
                {data.family.students.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="secondary">孩子</Badge>
                      {member.grade ? (
                        <span className="text-xs text-muted-foreground">
                          {member.grade}
                        </span>
                      ) : null}
                    </div>
                    {member.userId === profile.userId ? (
                      <span className="text-xs text-muted-foreground">我</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {profile.role === 'teacher' ? (
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-sm font-medium">我的学生</h2>
              <div className="mb-3 flex gap-2">
                <Input
                  value={studentCode}
                  onChange={(event) => setStudentCode(event.target.value)}
                  placeholder="输入学生邀请码"
                  aria-label="学生邀请码"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!studentCode.trim()) {
                      toast.error('请输入学生邀请码');
                      return;
                    }
                    try {
                      const result = await accountApi.addStudent(
                        studentCode.trim(),
                      );
                      toast.success(`已添加学生 ${result.studentName}`);
                      setStudentCode('');
                      await reload();
                    } catch (error) {
                      toast.error('添加失败，请核对邀请码');
                    }
                  }}
                >
                  添加
                </Button>
              </div>
              {(data?.students ?? []).map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{student.name}</span>
                    <Badge variant="secondary">学生</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={childOpen} onOpenChange={setChildOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加孩子</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                value={childForm.name}
                onChange={(event) =>
                  setChildForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="孩子姓名"
                aria-label="孩子姓名"
              />
              <Input
                value={childForm.grade}
                onChange={(event) =>
                  setChildForm((prev) => ({
                    ...prev,
                    grade: event.target.value,
                  }))
                }
                placeholder="年级（选填）"
                aria-label="孩子年级"
              />
              <Input
                value={childForm.loginName}
                onChange={(event) =>
                  setChildForm((prev) => ({
                    ...prev,
                    loginName: event.target.value,
                  }))
                }
                placeholder="孩子登录名（≥4 位）"
                aria-label="孩子登录名"
              />
              <Input
                type="password"
                value={childForm.password}
                onChange={(event) =>
                  setChildForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="初始密码（≥6 位）"
                aria-label="孩子初始密码"
              />
            </div>
            <DialogFooter>
              <Button onClick={submitChild}>创建并加入家庭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">消息中心</h2>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={profile.notifyMute}
                    aria-label="免打扰模式"
                    onChange={async (event) => {
                      await accountApi.saveProfile({
                        role: profile.role,
                        name: profile.name,
                        notifyMute: event.target.checked,
                      });
                      await reload();
                      toast.success(
                        event.target.checked
                          ? '已开启免打扰，重要通知仍会送达'
                          : '已关闭免打扰',
                      );
                    }}
                  />
                  免打扰
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await messageApi.markAllRead();
                    await load();
                  }}
                >
                  全部已读
                </Button>
              </div>
            </div>
            {loading ? <LoadingBlock /> : null}
            {!loading && messages.length === 0 ? (
              <EmptyBlock text="暂无消息" />
            ) : null}
            {(() => {
              const today = dayjs().format('YYYY-MM-DD');
              return [
                {
                  label: '今天',
                  items: messages.filter(
                    (m) => dayjs(m.createdAt).format('YYYY-MM-DD') === today,
                  ),
                },
                {
                  label: '更早',
                  items: messages.filter(
                    (m) => dayjs(m.createdAt).format('YYYY-MM-DD') !== today,
                  ),
                },
              ];
            })().map((group) =>
              group.items.length > 0 ? (
                <div key={group.label}>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.slice(0, 8).map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start gap-2 border-b py-2 last:border-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          {message.priority === 'urgent' ? (
                            <span className="tag o mr-1">重要</span>
                          ) : null}
                          {message.title}
                          {!message.isRead ? (
                            <span className="ml-1 inline-block size-1.5 rounded-full bg-primary" />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {message.content}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {dayjs(message.createdAt).format('MM-DD HH:mm')}
                        </p>
                      </div>
                      {message.linkPath ? (
                        <Link
                          to={message.linkPath}
                          onClick={async () => {
                            await messageApi.markRead(message.id);
                          }}
                          className="text-xs text-primary"
                        >
                          查看
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null,
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑资料与身份</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={form.role === role ? 'default' : 'outline'}
                  onClick={() => setForm((prev) => ({ ...prev, role }))}
                >
                  {ROLE_LABEL[role]}
                </Button>
              ))}
            </div>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="姓名"
              aria-label="姓名"
            />
            <Input
              value={form.grade}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, grade: event.target.value }))
              }
              placeholder="年级（选填）"
              aria-label="年级"
            />
            <Input
              value={form.subjectTags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subjectTags: event.target.value }))
              }
              placeholder="任教科目（选填）"
              aria-label="任教科目"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProfile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MePage;
