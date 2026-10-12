import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { authApi } from '@client/src/api';
import { refreshAccount, useAccount } from '@client/src/hooks/useAccount';
import { setToken } from '@client/src/utils/auth-token';

/** 仅本地开发出现的全局身份切换器：任意页面一键换身份 */
const DEV_ACCOUNTS: { loginName: string; label: string }[] = [
  { loginName: 'admin001', label: '管理员 · 运营小赵' },
  { loginName: 'parent001', label: '家长 · 林爸（户主）' },
  { loginName: 'parent002', label: '家长 · 林妈（第二位）' },
  { loginName: 'child001', label: '孩子 · 林小满' },
  { loginName: 'teacher001', label: '老师 · 周老师' },
  { loginName: 'teacher002', label: '老师 · 陈老师' },
];

const DevFloatingSwitch = () => {
  const { data } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('123456');
  const [busy, setBusy] = useState<boolean>(false);

  const switchTo = async (loginName: string) => {
    setBusy(true);
    try {
      const result = await authApi.login({ loginName, password });
      setToken(result.token);
      await refreshAccount();
      toast.success(`已切换：${result.name}（${result.role}）`);
      setOpen(false);
      navigate(location.pathname, { replace: true });
    } catch (error) {
      toast.error('切换失败：账号或密码不正确');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        aria-label="切换身份"
        className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <RefreshCw />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>切换身份（开发用）</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            当前：{data?.profile?.name ?? '未登录'} ·{' '}
            {data?.profile?.role ?? '-'}
          </p>
          <Select
            disabled={busy}
            onValueChange={(value: string) => switchTo(value)}
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
                onClick={() => switchTo(item.loginName)}
              >
                {item.label.split(' · ')[1]}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DevFloatingSwitch;
