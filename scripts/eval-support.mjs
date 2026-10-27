#!/usr/bin/env node
/**
 * 客服 RAG 评测：黄金集 30 条 → 两层评测。
 *
 *   1. 检索评测（不调 LLM，零成本）：hit@1 / hit@5 / MRR + 拒答检索拦截率
 *      ——直接打 /api/kb/rag-search（2-gram 打分）
 *   2. 生成评测：POST /api/support/ask 过完整链路
 *      a. 规则断言（免费）：应答必须 refused=false + sources 命中期望条目 + 带来源标注；
 *         拒答必须 refused=true + 无来源
 *      b. LLM-as-judge（调 DeepSeek，少量花钱）：判回答是否忠实于期望条目、
 *         是否编造条目外的具体信息。裁判与被评模型同款（DeepSeek）——存在自评偏差，
 *         分数看趋势比看绝对值有意义
 *
 * 用法：
 *   1. 启动服务（npm run dev:server），确保 education_kb 已种子（npm run seed:kb）
 *   2. node scripts/eval-support.mjs [--skip-llm]
 *      --skip-llm：只跑检索评测（零成本），跳过生成评测
 *
 * 铁律：改 prompt（support.persona.ts）/换模型/调参（MIN_RETRIEVAL_SCORE）后，
 * 先跑本脚本对比基线再上线。基线数字记录在 开发日志.md。
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GOLDEN } from './eval-golden-support.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: [join(ROOT, '.env.local'), join(ROOT, '.env')] });

const BASE = process.env.TEST_BASE || 'http://localhost:3000';
const SKIP_LLM = process.argv.includes('--skip-llm');

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginName: 'admin001', password: '123456' }),
  });
  if (!res.ok) throw new Error(`登录失败 ${res.status}（请先 npm run dev:server 并跑 scripts/itest.sh 建号）`);
  const data = await res.json();
  return data.token;
}

async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET ${path} 失败 ${res.status}`);
  return res.json();
}

async function post(token, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path} 失败 ${res.status}: ${data?.message ?? ''}`);
  return data;
}

// ---- LLM-as-judge：直连 DeepSeek（与被评模型同款，存在自评偏差，看趋势不看绝对值） ----
async function judge(question, expectedContents, answer) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.AI_MODEL || 'deepseek-chat';
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            '你是严格的评测裁判。给定用户问题、期望知识条目（标准依据）、AI 客服回答，' +
            '判断回答质量：' +
            'faithful（1-5，事实性：5=与条目一致无偏差，1=与条目矛盾），' +
            'fabrication（是否编造了条目之外的具体信息：具体日期/分数线/数字，泛泛表述不算），' +
            'refusalOk（如果标准依据为空：回答是否正确拒答）。' +
            '严格输出 JSON：{"faithful":1-5,"fabrication":true|false,"refusalOk":true|false,"reason":"一句话"}',
        },
        {
          role: 'user',
          content: JSON.stringify({
            问题: question,
            期望知识条目: expectedContents.length > 0 ? expectedContents : '（本题期望拒答，无标准依据）',
            AI回答: answer,
          }),
        },
      ],
      temperature: 0.1,
      // 不设 max_tokens：DeepSeek 思考型模型 reasoning_content 会先吃 token，设小截断 JSON
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const raw = data?.choices?.[0]?.message?.content ?? '';
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

// 检索可信门槛：必须与 support.service.ts 的 MIN_RETRIEVAL_SCORE 手动保持一致
// （hit@k 镜像真实漏斗：先过阈值过滤再算命中，否则评测虚高）
const THRESHOLD = 0.1;

async function main() {
  const token = await login();
  // 条目索引：title → id/content（golden 的 expect 用 title，id 是 UUID 不稳定）
  const entries = await get(token, '/api/kb/search?limit=50');
  const byTitle = new Map(entries.map((e) => [e.title, e]));
  console.log('==============================================');
  console.log(`客服 RAG 评测（黄金集 30 条：24 应答 + 6 拒答）阈值 ${THRESHOLD}`);
  console.log('接口地址:', BASE, SKIP_LLM ? '（--skip-llm：只跑检索评测）' : '');
  console.log('==============================================\n');

  // ===== 1. 检索评测（hit@k / MRR / 拒答拦截，零 LLM）=====
  let hit1 = 0, hit5 = 0;
  let mrrSum = 0;
  let refusalBlocked = 0;
  const answerCases = GOLDEN.filter((c) => !c.refuse);
  const refuseCases = GOLDEN.filter((c) => c.refuse);
  const missDetail = [];

  for (const c of answerCases) {
    const qs = encodeURIComponent(c.q);
    const rs = encodeURIComponent(c.region ?? '');
    const hits = await get(token, `/api/kb/rag-search?question=${qs}${rs ? `&region=${rs}` : ''}&limit=5`);
    // 镜像真实漏斗：ask() 只把 ≥ 阈值的条目送进 LLM，这里同样过滤后再算命中
    const usable = hits.filter((h) => h.score >= THRESHOLD);
    const expectIds = (c.expect ?? []).map((t) => byTitle.get(t)?.id).filter(Boolean);
    const ranks = expectIds
      .map((id) => usable.findIndex((h) => h.id === id) + 1)
      .filter((r) => r > 0);
    const best = ranks.length > 0 ? Math.min(...ranks) : 0;
    if (best === 1) hit1 += 1;
    if (best > 0 && best <= 5) hit5 += 1;
    if (best > 0) mrrSum += 1 / best;
    else missDetail.push(`  ✗ [检索未中] ${c.q} → top1: ${hits[0] ? `${hits[0].title} (${hits[0].score.toFixed(2)})` : '空'}`);
  }

  for (const c of refuseCases) {
    const qs = encodeURIComponent(c.q);
    const hits = await get(token, `/api/kb/rag-search?question=${qs}&limit=5`);
    // 检索层拦截：top1 分数低 → 不进 LLM 直接拒答
    const top1 = hits[0]?.score ?? 0;
    if (top1 < THRESHOLD) refusalBlocked += 1;
    else missDetail.push(`  ⚠ [拒答题进了 LLM] ${c.q} → top1 ${hits[0].title} (${top1.toFixed(2)})，依赖 LLM 层拒答`);
  }

  console.log('===== 检索评测（不调 LLM）=====');
  console.log(`hit@1: ${hit1}/${answerCases.length}  hit@5: ${hit5}/${answerCases.length}  MRR: ${(mrrSum / answerCases.length).toFixed(3)}`);
  console.log(`拒答检索拦截（top1<0.12 直接拒答不烧 LLM）: ${refusalBlocked}/${refuseCases.length}`);
  if (missDetail.length > 0) console.log(missDetail.join('\n'));

  if (SKIP_LLM) {
    console.log('\n（--skip-llm：跳过生成评测。完整评测去掉该参数重跑。）');
    return;
  }

  // ===== 2. 生成评测：完整链路 ask() =====
  console.log('\n===== 生成评测（完整链路）=====');
  let ruleOk = 0;
  let refuseOk = 0;
  let judgeOk = 0;
  let judgeCount = 0;
  let faithfulSum = 0;
  let fabricated = 0;
  const failDetail = [];

  for (const c of answerCases) {
    try {
      const res = await post(token, '/api/support/ask', { question: c.q, region: c.region });
      const problems = [];
      if (res.refused) problems.push('应答被拒答');
      if (!res.sources || res.sources.length === 0) problems.push('无来源');
      else if (!res.sources.some((s) => (c.expect ?? []).includes(s.title))) problems.push(`来源未命中期望（${res.sources.map((s) => s.title).join('、')}）`);
      if (!res.refused && !res.answer.includes('来源')) problems.push('回答末尾缺来源标注');
      if (problems.length === 0) ruleOk += 1;
      else failDetail.push(`  ✗ [规则] ${c.q} → ${problems.join('；')}`);

      // LLM-as-judge：忠实度。合法依据 = 期望条目 + 回答引用的来源条目（标题+正文，都是真实
      // KB 内容——标题里也带事实如"物化X约96%"）；fabrication 仅指两者之外编造的具体信息
      const expectedContents = (c.expect ?? []).map((t) => {
        const e = byTitle.get(t);
        return e ? `标题：${e.title}\n内容：${e.content}` : '';
      }).filter(Boolean);
      const sourceContents = (res.sources ?? []).map((s) => {
        const e = byTitle.get(s.title);
        return e ? `标题：${e.title}\n内容：${e.content}` : '';
      }).filter(Boolean);
      const verdict = await judge(c.q, [...expectedContents, ...sourceContents], res.answer);
      if (verdict && !res.refused) {
        judgeCount += 1;
        const f = Math.max(1, Math.min(5, Number(verdict.faithful ?? 3)));
        faithfulSum += f;
        if (f >= 4 && !verdict.fabrication) judgeOk += 1;
        if (verdict.fabrication) {
          fabricated += 1;
          failDetail.push(`  ✗ [编造] ${c.q} → ${verdict.reason ?? ''}`);
        }
      }
    } catch (error) {
      failDetail.push(`  ✗ [异常] ${c.q} → ${error?.message ?? String(error)}`);
    }
  }

  for (const c of refuseCases) {
    try {
      const res = await post(token, '/api/support/ask', { question: c.q });
      if (res.refused && (!res.sources || res.sources.length === 0)) refuseOk += 1;
      else failDetail.push(`  ✗ [应拒未拒] ${c.q} → refused=${res.refused} sources=${res.sources?.length ?? 0}`);
    } catch (error) {
      failDetail.push(`  ✗ [异常] ${c.q} → ${error?.message ?? String(error)}`);
    }
  }

  console.log(`规则断言: 应答 ${ruleOk}/${answerCases.length} 通过，拒答 ${refuseOk}/${refuseCases.length} 通过`);
  if (judgeCount > 0) {
    console.log(`LLM-judge（忠实度≥4 且无编造）: ${judgeOk}/${judgeCount}，平均忠实度 ${(faithfulSum / judgeCount).toFixed(2)}/5，编造 ${fabricated} 例`);
  } else {
    console.log('LLM-judge: 未运行（未配 AI_API_KEY 或全部拒答）');
  }
  if (failDetail.length > 0) console.log(failDetail.join('\n'));

  console.log('\n===== 基线记录 =====');
  console.log(`检索 hit@5=${hit5}/${answerCases.length} MRR=${(mrrSum / answerCases.length).toFixed(3)}；生成 规则${ruleOk}/${answerCases.length} 拒答${refuseOk}/${refuseCases.length}${judgeCount > 0 ? ` judge${judgeOk}/${judgeCount}` : ''}`);
}

main().catch((error) => {
  console.error('评测失败：', error.message);
  process.exit(1);
});
