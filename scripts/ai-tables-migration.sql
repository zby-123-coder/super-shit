-- AI 调用日志 + 学生记忆（幂等，2026-10-21）
CREATE TABLE IF NOT EXISTS public.ai_invocation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  role varchar(16),
  feature varchar(32) NOT NULL,
  scope_type varchar(32),
  scope_id varchar(255),
  provider varchar(16) NOT NULL DEFAULT 'llm',
  status varchar(16) NOT NULL DEFAULT 'success',
  latency_ms integer,
  result_preview text,
  _created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_log_user ON public.ai_invocation_log (user_id, _created_at);
CREATE INDEX IF NOT EXISTS idx_ai_log_feature ON public.ai_invocation_log (user_id, feature);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id varchar(64) NOT NULL,
  kind varchar(24) NOT NULL DEFAULT 'fact',
  content varchar(500) NOT NULL,
  importance integer NOT NULL DEFAULT 3,
  source varchar(64),
  hits integer NOT NULL DEFAULT 0,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ai_memory ON public.ai_memory (student_user_id, content);
CREATE INDEX IF NOT EXISTS idx_ai_memory_student ON public.ai_memory (student_user_id, importance);