#!/usr/bin/env node
/**
 * AI 能力真实性验证：逐个调用 AI 端点，明确标注「真实 LLM」还是「本地规则版」。
 *
 * 用法：
 *   1. 启动服务（npm run dev:server）
 *   2. node scripts/verify-ai.mjs
 *   可选环境变量：TEST_BASE / TEST_LOGIN / TEST_PASSWORD
 *
 * 输出一张表：端点 / 耗时 / 提供方 / 结论。
 * 未配置 AI_API_KEY 时全部为 rule（本地规则），本脚本会明确报告"0 次真实调用"。
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: [join(ROOT, '.env.local'), join(ROOT, '.env')] });

const BASE = process.env.TEST_BASE || 'http://localhost:3000';
const LOGIN = process.env.TEST_LOGIN || 'admin001';
const PASSWORD = process.env.TEST_PASSWORD || '123456';

function hasApiKey() {
  return Boolean(process.env.AI_API_KEY);
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginName: LOGIN, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`登录失败 ${res.status}（请先建好 ${LOGIN} 账号）`);
  const data = await res.json();
  return data.token;
}

async function call(token, name, path, options = {}) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
    const ms = Date.now() - started;
    const body = await res.json().catch(() => ({}));
    return { name, ok: res.ok, status: res.status, ms, body };
  } catch (error) {
    return { name, ok: false, status: 0, ms: Date.now() - started, body: { error: error.message } };
  }
}

function providerOf(result, keyConfigured) {
  // 规则版特征：文案含固定模板 / available:false / status 接口返回 rule
  if (result.name === 'ai/status') return result.body.provider ?? 'unknown';
  if (result.body?.available === false) return 'rule（明确降级）';
  if (!keyConfigured) return 'rule（推测：未配 key）';
  return 'llm（推测：已配 key）';
}

async function main() {
  const keyConfigured = hasApiKey();
  console.log('==============================================');
  console.log('AI 能力真实性验证');
  console.log('接口地址:', BASE);
  console.log('AI_API_KEY:', keyConfigured ? '已配置（可真实调用外部模型）' : '未配置（全部走本地规则版）');
  console.log('==============================================\n');

  const token = await login();
  const results = [];

  results.push(await call(token, 'ai/status', '/api/ai/status'));
  results.push(
    await call(token, 'ai/review-draft', '/api/ai/review-draft', {
      method: 'POST',
      body: JSON.stringify({ content: '已完成，错题已订正，用时 40 分钟', durationMin: 40, taskTitle: '错题整理' }),
    }),
  );
  results.push(
    await call(token, 'ai/variant', '/api/ai/variant', {
      method: 'POST',
      body: JSON.stringify({ subject: '数学', title: '已知 x + 25 = 48，求 x', knowledgePoint: '一元一次方程' }),
    }),
  );
  results.push(
    await call(token, 'ai/explain', '/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ subject: '数学', title: '求二次函数 y=x²-4x+3 的最小值', knowledgePoint: '二次函数最值', wrongReason: '概念不清' }),
    }),
  );
  results.push(await call(token, 'report/diagnosis', '/api/report/diagnosis?days=30'));
  results.push(
    await call(token, 'ops/generate', '/api/ops/generate', {
      method: 'POST',
      body: JSON.stringify({ grade: '初二', region: '杭州', subject: '数学', material: '验证脚本素材' }),
    }),
  );

  const pad = (s, n) => String(s).padEnd(n, ' ');
  console.log(pad('端点', 22), pad('状态', 8), pad('耗时', 8), '提供方');
  console.log('-'.repeat(70));
  for (const r of results) {
    const provider = providerOf(r, keyConfigured);
    console.log(pad(r.name, 22), pad(r.ok ? 'OK' : `FAIL ${r.status}`, 8), pad(`${r.ms}ms`, 8), provider);
  }

  const llmCount = results.filter((r) => r.ok && providerOf(r, keyConfigured).startsWith('llm')).length;
  console.log('\n----------------------------------------------');
  if (!keyConfigured) {
    console.log('结论：AI_API_KEY 未配置，本次全部为本地规则版，真实 LLM 调用 0 次。');
    console.log('如需验证真实调用：在 .env.local 配置 AI_API_KEY 后重启服务，再跑一次本脚本。');
  } else if (llmCount === results.length) {
    console.log(`结论：${results.length} 个能力全部走真实 LLM。`);
  } else {
    console.log(`结论：${llmCount}/${results.length} 个能力走真实 LLM，其余为降级（看服务端日志确认原因）。`);
  }
}

main().catch((error) => {
  console.error('验证失败：', error.message);
  process.exit(1);
});
