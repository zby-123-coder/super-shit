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
import { accountApi, messageApi } from '@client/src/api';
import { refreshAccount, useAccount } from '@client/src/hooks/useAccount';
import type { BindItemDTO, MessageDTO, UserRole } from '@shared/api.interface';

const ROLE_LABEL: Record<UserRole, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
  admin: '管理员',
};

const MePage = () => {
  const { data, reload } = useAccount();
  const profile = data?.profile;
  const [bindings, setBindings] = useState<{
    children: BindItemDTO[];
    students: BindItemDTO[];
    guardians: BindItemDTO[];
  }>({ children: [], students: [], guardians: [] });
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteCode, setInviteCode] = useState<string>('');
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
      const [bindResult, messageResult] = await Promise.all([
        accountApi.listBindings(),
        messageApi.list(),
      ]);
      setBindings(bindResult);
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

  const handleBind = async () => {
    if (!inviteCode.trim()) {
      toast.error('请输入邀请码');
      return;
    }
    try {
      const result = await accountApi.bind(inviteCode.trim());
      toast.success(`已绑定 ${result.name}`);
      setInviteCode('');
      await load();
      await reload();
    } catch (error) {
      toast.error('绑定失败，请核对邀请码');
    }
  };

  const handleUnbind = async (id: string) => {
    try {
      await accountApi.unbind(id);
      toast.success('已解除绑定');
      await load();
      await reload();
    } catch (error) {
      toast.error('解绑失败');
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

  const bindingList = [
    ...bindings.children.map((item) => ({ ...item, tag: '孩子' })),
    ...bindings.students.map((item) => ({ ...item, tag: '学生' })),
    ...bindings.guardians.map((item) => ({ ...item, tag: '家长' })),
  ];

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
        <Card data-ai-section-type="card-stat">
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

        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-medium">绑定关系</h2>
            <div className="mb-3 flex gap-2">
              <Input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="输入对方邀请码"
                aria-label="邀请码"
              />
              <Button size="sm" onClick={handleBind}>
                绑定
              </Button>
            </div>
            {bindingList.length === 0 ? (
              <EmptyBlock text="暂无绑定关系" />
            ) : (
              <div className="flex flex-col gap-2">
                {bindingList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary">{item.tag}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnbind(item.id)}
                    >
                      解绑
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">消息中心</h2>
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
            {loading ? <LoadingBlock /> : null}
            {!loading && messages.length === 0 ? (
              <EmptyBlock text="暂无消息" />
            ) : null}
            {messages.slice(0, 10).map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-2 border-b py-2 last:border-none"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
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
