BEGIN;

-- 登录凭证：登录名 + scrypt 密码哈希（不存明文）
CREATE TABLE IF NOT EXISTS auth_credential (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  login_name varchar(64) NOT NULL,
  password_hash varchar(255) NOT NULL,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  ),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  )
);
ALTER TABLE auth_credential ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_bypass_policy ON auth_credential TO service_role USING (true);
CREATE POLICY "修改全部数据" ON auth_credential AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "查看全部数据" ON auth_credential AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "修改本人数据" ON auth_credential AS PERMISSIVE FOR ALL TO authenticated USING (
  (current_setting('app.user_id'::text) = ANY (ARRAY[]::text[]))
  AND (current_setting('app.user_id'::text) = ((_created_by).user_id)::text)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_credential_user ON auth_credential (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_credential_login ON auth_credential (login_name);

-- 会话：只存 token 的 sha256，支持登出/改密撤销
CREATE TABLE IF NOT EXISTS auth_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(64) NOT NULL,
  token_hash varchar(64) NOT NULL,
  device_label varchar(255),
  expires_at TIMESTAMP(3) WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP(3) WITH TIME ZONE,
  last_used_at TIMESTAMP(3) WITH TIME ZONE,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  ),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  )
);
ALTER TABLE auth_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_bypass_policy ON auth_session TO service_role USING (true);
CREATE POLICY "修改全部数据" ON auth_session AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "查看全部数据" ON auth_session AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "修改本人数据" ON auth_session AS PERMISSIVE FOR ALL TO authenticated USING (
  (current_setting('app.user_id'::text) = ANY (ARRAY[]::text[]))
  AND (current_setting('app.user_id'::text) = ((_created_by).user_id)::text)
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_auth_session_token ON auth_session (token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session (user_id);

COMMIT;
