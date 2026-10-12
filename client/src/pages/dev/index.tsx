import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { PageHeader } from '@client/src/components/PageShell';
import { authApi } from '@client/src/api';
import { refreshAccount, useAccount } from '@client/src/hooks/useAccount';
import { setToken } from '@client/src/utils/auth-token';

/** 仅本地开发可见的快捷账号（联调脚本 scripts/itest.sh 创建） */
const DEV_ACCOUNTS: { loginName: string; label: string }[] = [
  { loginName: 'admin001', label: '管理员 · 运营小赵' },
  { loginName: 'teacher001', label: '老师 · 周老师' },
  { loginName: 'teacher002', label: '老师 · 陈老师' },
  { loginName: 'student001', label: '学生 · 林小满' },
  { loginName: 'parent001', label: '家长 · 林爸' },
];

const DevSwitchPage = () => {
  const { data } = useAccount();
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('123456');
  const [manual, setManual] = useState<{ loginName: string; password: string }>(
    { loginName: '', password: '' },
  );
  const [busy, setBusy] = useState<boolean>(false);

  const switchTo = async (loginName: string, pwd: string) => {
    if (!loginName.trim() || !pwd) {
      toast.error('请输入登录名与密码');
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.login({
        loginName: loginName.trim(),
        password: pwd,
      });
      setToken(result.token);
      await refreshAccount();
      toast.success(`已切换为 ${result.name}（${result.role}）`);
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('切换失败：账号或密码不正确');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="开发 · 身份切换"
        subtitle="仅本地开发环境显示，生产构建不会出现此入口"
      />

      <div className="flex flex-col gap-3 p-4">
        <Card data-ai-section-type="card-stat">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">当前身份</p>
            <p className="mt-1 text-sm font-medium">
              {data?.profile
                ? `${data.profile.name} · ${data.profile.role}`
                : '未登录'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">快捷切换（联调用账号）</p>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="统一密码"
              aria-label="统一密码"
            />
            <div className="flex flex-col gap-2">
              {DEV_ACCOUNTS.map((item) => (
                <Button
                  key={item.loginName}
                  variant="outline"
                  className="justify-between"
                  disabled={busy}
                  onClick={() => switchTo(item.loginName, password)}
                >
                  {item.label}
                  <span className="text-xs text-muted-foreground">
                    {item.loginName}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">手动登录</p>
            <Input
              value={manual.loginName}
              onChange={(event) =>
                setManual((prev) => ({
                  ...prev,
                  loginName: event.target.value,
                }))
              }
              placeholder="登录名"
              aria-label="手动登录名"
            />
            <Input
              type="password"
              value={manual.password}
              onChange={(event) =>
                setManual((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              placeholder="密码"
              aria-label="手动密码"
            />
            <Button
              disabled={busy}
              onClick={() => switchTo(manual.loginName, manual.password)}
            >
              登录并切换
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevSwitchPage;
