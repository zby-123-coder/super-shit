import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { PageHeader } from '@client/src/components/PageShell';
import { authApi } from '@client/src/api';
import { refreshAccount, useAccount } from '@client/src/hooks/useAccount';
import { setToken } from '@client/src/utils/auth-token';

/** 仅本地开发可见的快捷账号（联调脚本 scripts/itest-family.sh 创建） */
const DEV_ACCOUNTS: { loginName: string; label: string }[] = [
  { loginName: 'admin001', label: '管理员 · 运营小赵' },
  { loginName: 'parent001', label: '家长 · 林爸（户主）' },
  { loginName: 'parent002', label: '家长 · 林妈（第二位）' },
  { loginName: 'child001', label: '孩子 · 林小满' },
  { loginName: 'teacher001', label: '老师 · 周老师' },
  { loginName: 'teacher002', label: '老师 · 陈老师' },
];

const DevSwitchPage = () => {
  const { data } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState<string>('123456');
  const [manual, setManual] = useState<{ loginName: string; password: string }>(
    { loginName: '', password: '' },
  );
  const [busy, setBusy] = useState<boolean>(false);

  /** 选中即登录切换，停留在当前页面（在 dev 页则回首页） */
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
      toast.success(`已切换：${result.name}（${result.role}）`);
      const next =
        location.pathname === '/dev' ? '/' : location.pathname;
      navigate(next, { replace: true });
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
                ? `${data.profile.name} · ${data.profile.role}${
                    data.profile.familyName
                      ? ` · ${data.profile.familyName}`
                      : ''
                  }`
                : '未登录'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">一键切换身份</p>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="统一密码"
              aria-label="统一密码"
            />
            <Select
              disabled={busy}
              onValueChange={(value: string) => switchTo(value, password)}
            >
              <SelectTrigger aria-label="选择要切换的身份">
                <SelectValue placeholder="选择身份，选中即切换" />
              </SelectTrigger>
              <SelectContent>
                {DEV_ACCOUNTS.map((item) => (
                  <SelectItem key={item.loginName} value={item.loginName}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1">
              {DEV_ACCOUNTS.map((item) => (
                <Button
                  key={item.loginName}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={busy}
                  onClick={() => switchTo(item.loginName, password)}
                >
                  {item.label.split(' · ')[1]}
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
