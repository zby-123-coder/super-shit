import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { accountApi } from '@client/src/api';
import { refreshAccount } from '@client/src/hooks/useAccount';
import type { UserRole } from '@shared/api.interface';

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'student', label: '学生', desc: '完成任务打卡、看课表与进度' },
  { role: 'parent', label: '家长', desc: '查看孩子学情、课时与订单' },
  { role: 'teacher', label: '老师', desc: '带班学生、批阅打卡、消课' },
  { role: 'admin', label: '管理员', desc: '团队运营：用户、教务、内容' },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [subjectTags, setSubjectTags] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请先填写姓名');
      return;
    }
    setSubmitting(true);
    try {
      await accountApi.saveProfile({
        role,
        name: name.trim(),
        grade: grade.trim(),
        subjectTags: subjectTags.trim(),
      });
      await refreshAccount();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('保存身份信息失败，请重试');
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
              选择你的身份，进入对应的使用视图
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((item) => {
              const Icon =
                item.role === 'student'
                  ? GraduationCap
                  : item.role === 'parent'
                    ? Users
                    : item.role === 'teacher'
                      ? UserRound
                      : ShieldCheck;
              return (
                <button
                  key={item.role}
                  type="button"
                  aria-pressed={role === item.role}
                  onClick={() => setRole(item.role)}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition ${
                    role === item.role
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <Icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="姓名"
              aria-label="姓名"
            />
            <Input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="年级（选填，如 初二）"
              aria-label="年级"
            />
            {role === 'teacher' ? (
              <Input
                value={subjectTags}
                onChange={(event) => setSubjectTags(event.target.value)}
                placeholder="任教科目（选填，如 数学、物理）"
                aria-label="任教科目"
              />
            ) : null}
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            进入平台
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;
