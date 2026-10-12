-- 本地联调专用建表脚本（纯 PostgreSQL，无平台 RLS / user_profile）
-- 用法：psql -d jiajiao -f scripts/local-migration.sql
BEGIN;

CREATE TABLE IF NOT EXISTS app_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  role varchar(32) NOT NULL DEFAULT 'student',
  name varchar(64),
  phone varchar(32),
  grade varchar(32),
  subject_tags varchar(255),
  avatar_url text,
  invite_code varchar(16),
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_app_profile_user ON app_profile (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_app_profile_invite ON app_profile (invite_code);

CREATE TABLE IF NOT EXISTS guardian_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id varchar(64) NOT NULL,
  student_user_id varchar(64) NOT NULL,
  relation_type varchar(32) NOT NULL DEFAULT 'parent',
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_guardian_pair ON guardian_link (parent_user_id, student_user_id);

CREATE TABLE IF NOT EXISTS teaching_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id varchar(64) NOT NULL,
  student_user_id varchar(64) NOT NULL,
  subject varchar(64),
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_teaching_pair ON teaching_link (teacher_user_id, student_user_id);

CREATE TABLE IF NOT EXISTS course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id varchar(64) NOT NULL,
  teacher_user_id varchar(64),
  subject varchar(64) NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location varchar(255),
  status varchar(32) NOT NULL DEFAULT 'pending',
  lesson_count integer NOT NULL DEFAULT 1,
  remark text,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_course_student ON course (student_user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_course_teacher ON course (teacher_user_id, start_at);

CREATE TABLE IF NOT EXISTS lesson_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id varchar(64) NOT NULL,
  subject varchar(64) NOT NULL,
  total_lessons integer NOT NULL DEFAULT 0,
  used_lessons integer NOT NULL DEFAULT 0,
  alert_threshold integer NOT NULL DEFAULT 3,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_lesson_account ON lesson_account (student_user_id, subject);

CREATE TABLE IF NOT EXISTS lesson_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id varchar(64) NOT NULL,
  subject varchar(64) NOT NULL,
  change_amount integer NOT NULL,
  change_type varchar(32) NOT NULL,
  course_id uuid,
  operator_user_id varchar(64),
  remark text,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_ledger_student ON lesson_ledger (student_user_id, _created_at);

CREATE TABLE IF NOT EXISTS study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id varchar(64) NOT NULL,
  subject varchar(64) NOT NULL,
  chapter varchar(255) NOT NULL,
  percent integer NOT NULL DEFAULT 0,
  current_point varchar(255),
  updated_by_user_id varchar(64),
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_progress_chapter ON study_progress (student_user_id, subject, chapter);

CREATE TABLE IF NOT EXISTS study_task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id varchar(64) NOT NULL,
  student_user_id varchar(64) NOT NULL,
  subject varchar(64),
  title varchar(255) NOT NULL,
  content text,
  due_at timestamptz,
  status varchar(32) NOT NULL DEFAULT 'open',
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_task_student ON study_task (student_user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_task_teacher ON study_task (teacher_user_id, due_at);

CREATE TABLE IF NOT EXISTS task_checkin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  student_user_id varchar(64) NOT NULL,
  content text,
  image_urls text[],
  duration_min integer,
  status varchar(32) NOT NULL DEFAULT 'submitted',
  review_comment text,
  reviewed_by_user_id varchar(64),
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_checkin_task ON task_checkin (task_id);
CREATE INDEX IF NOT EXISTS idx_checkin_student ON task_checkin (student_user_id, _created_at);

CREATE TABLE IF NOT EXISTS article (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  column_type varchar(32) NOT NULL DEFAULT 'news',
  cover_url text,
  summary text,
  content text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'published',
  pinned boolean NOT NULL DEFAULT false,
  read_count integer NOT NULL DEFAULT 0,
  author_user_id varchar(64),
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_article_column ON article (column_type, _created_at);

CREATE TABLE IF NOT EXISTS article_favorite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  article_id uuid NOT NULL,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_favorite ON article_favorite (user_id, article_id);

CREATE TABLE IF NOT EXISTS notice_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  msg_type varchar(32) NOT NULL DEFAULT 'system',
  title varchar(255) NOT NULL,
  content text,
  link_path varchar(255),
  is_read boolean NOT NULL DEFAULT false,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE INDEX IF NOT EXISTS idx_message_user ON notice_message (user_id, _created_at);

CREATE TABLE IF NOT EXISTS auth_credential (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  login_name varchar(64) NOT NULL,
  password_hash varchar(255) NOT NULL,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_credential_user ON auth_credential (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_credential_login ON auth_credential (login_name);

CREATE TABLE IF NOT EXISTS auth_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  token_hash varchar(64) NOT NULL,
  device_label varchar(255),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  _created_at timestamptz NOT NULL DEFAULT now(),
  _created_by varchar(64),
  _updated_at timestamptz NOT NULL DEFAULT now(),
  _updated_by varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_session_token ON auth_session (token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session (user_id);

COMMIT;
