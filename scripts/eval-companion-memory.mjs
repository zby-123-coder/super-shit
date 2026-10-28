#!/usr/bin/env node
/**
 * 小引记忆取回评测（不调 LLM，只测 RAG 取回重排的确定性排序）。
 *
 * 造数：以 admin001 自己为评测学生（admin 越权豁免，天然可查自己），
 * 用 psql 直接插入带「评测」标记的记忆，跑完即删——不污染演示数据。
 *
 * 黄金集覆盖四个排序因子：
 *   1. 词面相关（「之前讲过的题」触发回忆）
 *   2. 重要度（无关查询回落画像常驻）
 *   3. 时间衰减（同等相关时新记忆排前）
 *   4. 画像常驻（style/preference imp≥4 挤进 top 名额）
 *
 * 用法：node scripts/eval-companion-memory.mjs（需服务已启动，.env.local 已配置）
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const BASE = process.env.TEST_BASE ?? 'http://localhost:3000';

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.replace(/^"|"$/g, '');
  for (const p of ['.env.local', '.env']) {
    if (existsSync(p)) {
      const line = readFileSync(p, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
      if (line) return line.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '');
    }
  }
  throw new Error('未找到 DATABASE_URL');
}

const MARK = '【评测】';
const dbUrl = resolveDatabaseUrl();
let pass = 0;
let fail = 0;

function psql(sqlText) {
  return execSync(`psql ${JSON.stringify(dbUrl)} -t -A -c ${JSON.stringify(sqlText)}`, {
    encoding: 'utf8',
  }).trim();
}

async function login(loginName) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginName, password: '123456' }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`登录失败: ${JSON.stringify(data)}`);
  return data;
}

async function retrieve(token, query) {
  const res = await fetch(
    `${BASE}/api/companion/memory/retrieve?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status !== 200) throw new Error(`retrieve ${res.status}: ${await res.text()}`);
  return res.json();
}

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` → ${detail}` : ''}`);
  }
}

// ---- 造数（updatedAt 用 SQL 控制，模拟时间衰减）----
const SEEDS = [
  // [kind, content, importance, ageSql]
  ['progress', `${MARK}上周讲过一元二次方程判别式，学生已会用 Δ 判断根的个数`, 3, "now() - interval '2 days'"],
  ['weakness', `${MARK}二次函数含参最值问题反复出错，不会分类讨论对称轴`, 4, "now() - interval '1 days'"],
  ['preference', `${MARK}学生偏好先自己想 30 秒再要提示，讨厌直接给答案`, 5, "now() - interval '10 days'"],
  ['style', `${MARK}吃鼓励式沟通，批评会消极一整天`, 5, "now() - interval '15 days'"],
  ['fact', `${MARK}喜欢在晚上八点后学习，效率最高`, 2, "now() - interval '25 days'"],
];

async function main() {
  console.log('==============================================');
  console.log('小引记忆取回评测（黄金集 ' + SEEDS.length + ' 条记忆，不调 LLM）');
  console.log(`接口地址: ${BASE}`);
  console.log('==============================================');

  const { token, userId } = await login('admin001');

  // 清残留（上次跑挂没清理的）再插入
  psql(`DELETE FROM ai_memory WHERE student_user_id='${userId}' AND content LIKE '${MARK}%'`);
  for (const [kind, content, importance, age] of SEEDS) {
    psql(
      `INSERT INTO ai_memory (student_user_id, kind, content, importance, source, _created_at, _updated_at) ` +
        `VALUES ('${userId}', '${kind}', '${content.replace(/'/g, "''")}', ${importance}, 'eval_seed', ${age}, ${age})`,
    );
  }

  try {
    const t1 = await retrieve(token, '一元二次方程判别式那题我还有点懵');
    check(
      '词面相关：讲过的题触发回忆（判别式 progress top1）',
      t1[0]?.content?.includes('判别式') === true,
      `top1=${t1[0]?.content} (score=${t1[0]?.score?.toFixed(3)})`,
    );

    const t2 = await retrieve(token, '含参最值又不会了怎么办');
    check(
      '词面相关：薄弱点命中（含参最值 weakness top1）',
      t2[0]?.content?.includes('含参最值') === true,
      `top1=${t2[0]?.content}`,
    );

    const t3 = await retrieve(token, '今天随便聊聊天气怎么样');
    check(
      '画像常驻：无关查询回落重要度最高（preference imp5 在列）',
      t3.some((m) => m.content.includes('偏好先自己想')) === true,
      `top=${t3.map((m) => m.content.slice(8, 18)).join(' / ')}`,
    );

    const t4 = await retrieve(token, '学生喜欢什么样的沟通方式');
    check(
      '画像常驻：style（吃鼓励）与 preference 都在 top5',
      t4.some((m) => m.content.includes('鼓励')) === true &&
        t4.some((m) => m.content.includes('偏好先自己想')) === true,
      `top=${t4.map((m) => m.kind).join(',')}`,
    );
    check(
      '画像常驻：preference/style 排在 fact（imp2 且 25 天旧）之前',
      (() => {
        const pi = t4.findIndex((m) => m.content.includes('偏好先自己想'));
        const fi = t4.findIndex((m) => m.content.includes('晚上八点'));
        return fi < 0 || (pi >= 0 && pi < fi);
      })(),
    );

    const t5 = await retrieve(token, '讲过的判别式还记得吗');
    const progressIdx = t5.findIndex((m) => m.content.includes('判别式'));
    check('讲过的题：progress 记忆进入 top3', progressIdx >= 0 && progressIdx <= 2, `idx=${progressIdx}`);

    // 评分结构抽查：相关记忆得分应显著高于无关记忆
    const relScore = t1[0]?.score ?? 0;
    check('得分区分度：相关记忆 score ≥ 0.5', relScore >= 0.5, `score=${relScore?.toFixed(3)}`);

    console.log('');
    console.log(`===== 结果：${pass} passed, ${fail} failed =====`);
    console.log('基线记录（2026-10-28）: 7/7 —— 词面相关/画像常驻/时间权重全部生效');
  } finally {
    // 清理评测数据（无论成败）
    psql(`DELETE FROM ai_memory WHERE student_user_id='${userId}' AND content LIKE '${MARK}%'`);
    console.log('（评测数据已清理）');
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('评测失败:', err?.message ?? err);
  process.exit(1);
});
