#!/usr/bin/env node
/**
 * ai_memory v2：影子 agent 记忆总结所需的 3 列。
 *   status       active/superseded —— 冲突 merge 后旧记忆保留可回溯（时间链）
 *   superseded_by  指向取代本条的新记忆 id
 *   source_session_id  影子 agent 溯源：哪次对话总结出来的
 *
 * 可重复执行（IF NOT EXISTS）。用法：DATABASE_URL=... node scripts/migrate-ai-memory-v2.mjs
 * 或者从 .env.local 自动读取（dotenvx 注入，见 package.json 现有脚本惯例）。
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.replace(/^"|"$/g, '');
  for (const p of ['.env.local', '.env']) {
    if (existsSync(p)) {
      const line = readFileSync(p, 'utf8')
        .split('\n')
        .find((l) => l.startsWith('DATABASE_URL='));
      if (line) return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
    }
  }
  throw new Error('未找到 DATABASE_URL（环境变量或 .env.local）');
}

const url = resolveDatabaseUrl();
const stmts = [
  `ALTER TABLE ai_memory ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'active'`,
  `ALTER TABLE ai_memory ADD COLUMN IF NOT EXISTS superseded_by uuid`,
  `ALTER TABLE ai_memory ADD COLUMN IF NOT EXISTS source_session_id uuid`,
];
for (const stmt of stmts) {
  execSync(`psql "${url}" -c ${JSON.stringify(stmt)}`, { stdio: 'inherit' });
}
console.log('ai_memory v2 迁移完成');
