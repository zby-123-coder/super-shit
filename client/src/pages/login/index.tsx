import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import { authApi } from '@client/src/api';
import { refreshAccount } from '@client/src/hooks/useAccount';
import { setToken } from '@client/src/utils/auth-token';
import type { UserRole } from '@shared/api.interface';

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'student', label: '学生', desc: '任务打卡、看课表进度' },
  { role: 'parent', label: '家长', desc: '看孩子学情与课时' },
  { role: 'teacher', label: '老师', desc: '带班、批阅、消课' },
  { role: 'admin', label: '管理员', desc: '用户教务内容与数据' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('parent');
  const [name, setName] = useState<string>('');
  const [extra, setExtra] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const enter = async (token: string) => {
    setToken(token);
    await refreshAccount();
    navigate('/', { replace: true });
  };

  const doLogin = async () => {
    if (!loginName.trim() || !password) {
      toast.error('请输入登录名与密码');
      return;
    }
    setSubmitting(true);
    try {
      const result = await authApi.login({
        loginName: loginName.trim(),
        password,
      });
      await enter(result.token);
    } catch (error) {
      toast.error('登录名或密码不正确');
    } finally {
      setSubmitting(false);
    }
  };

  const doRegister = async () => {
    if (loginName.trim().length < 4) {
      toast.error('登录名至少 4 位');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少 6 位');
      return;
    }
    if (!name.trim()) {
      toast.error('请填写姓名');
      return;
    }
    setSubmitting(true);
    try {
      const result = await authApi.register({
        loginName: loginName.trim(),
        password,
        role,
        name: name.trim(),
        grade: role === 'student' ? extra : undefined,
        subjectTags: role === 'teacher' ? extra : undefined,
      });
      toast.success('注册成功');
      await enter(result.token);
    } catch (error) {
      toast.error('注册失败：登录名可能已被占用');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-[400px]">
        <CardContent className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold">家教团队学习管理平台</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              独立账号体系：手机号或账号 + 密码登录
            </p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="flex flex-col gap-3">
              <Input
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="登录名（手机号或账号）"
                aria-label="登录名"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="密码"
                aria-label="密码"
              />
              <Button onClick={doLogin} disabled={submitting}>
                登录
              </Button>
            </TabsContent>

            <TabsContent value="register" className="flex flex-col gap-3">
              <Input
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="登录名（手机号或账号，≥4 位）"
                aria-label="注册登录名"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="密码（≥6 位）"
                aria-label="注册密码"
              />
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="姓名"
                aria-label="姓名"
              />
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    aria-pressed={role === item.role}
                    onClick={() => setRole(item.role)}
                    className={`rounded-xl border p-3 text-left text-xs ${
                      role === item.role
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-muted-foreground">{item.desc}</div>
                  </button>
                ))}
              </div>
              <Input
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                placeholder={
                  role === 'student'
                    ? '年级（选填，如 初二）'
                    : role === 'teacher'
                      ? '任教科目（选填，如 数学）'
                      : '备注（选填）'
                }
                aria-label="补充信息"
              />
              <Button onClick={doRegister} disabled={submitting}>
                注册并进入
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
