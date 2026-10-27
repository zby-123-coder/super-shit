#!/usr/bin/env node
/**
 * AI 观测层迁移：ai_span 表（span 树，trace 根 = ai_invocation_log.call_id）。
 *
 * 设计（对应产品诉求「调用留痕升级为可观测的 span 树 + Langfuse 接入」）：
 *   - trace：一次 AI 调用 = ai_invocation_log 一行（callId 即 traceId，用户可回看的调用历史不变）
 *   - span：callId 下的子观测（kb.search / prompt.build / llm.call / answer.compose），
 *     llm.call 带 token 用量（prompt/completion/total），Langfuse 映射为 generation
 *   - event：一次事件（如 feedback 👍👎），Langfuse 映射为 score
 *
 * 幂等：CREATE TABLE IF NOT EXISTS，重复执行无副作用。
 * 用法：node scripts/migrate-ai-span.mjs
 */
import { config } from 'dotenv';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: [join(ROOT, '.env.local'), join(ROOT, '.env')] });

const url = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;
if (!url) {
  console.error('缺少 DATABASE_URL');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

const CREATE = `
CREATE TABLE IF NOT EXISTS public.ai_span (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL,
  parent_span_id uuid,
  span_type varchar(16) NOT NULL DEFAULT 'span',
  name varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'success',
  latency_ms integer,
  model varchar(64),
  payload jsonb,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_span_trace ON public.ai_span (trace_id);
`;

async function main() {
  await sql.unsafe(CREATE);
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM ai_span`;
  console.log(`ai_span 迁移完成：表已就绪，当前 ${count} 条 span。`);
  await sql.end();
}

main().catch((error) => {
  console.error('迁移失败：', error.message);
  process.exit(1);
});
