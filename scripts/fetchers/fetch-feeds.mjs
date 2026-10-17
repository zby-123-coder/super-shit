#!/usr/bin/env node
/**
 * 教育信息抓取器：抓取政策公告/考试动态，输出结构化 JSON。
 *
 * 用法：
 *   node scripts/fetchers/fetch-feeds.mjs            # 抓取所有信源
 *   node scripts/fetchers/fetch-feeds.mjs --only zjzs # 只抓某个信源
 *   node scripts/fetchers/fetch-feeds.mjs --days 7   # 只保留最近 N 天
 *
 * 输出：data/feeds/YYYY-MM-DD.json
 *
 * 与运营工作流的配合：
 *   1. 跑本脚本 → 得到当日信息摘要 JSON
 *   2. 把感兴趣的 title+url 粘贴到管理后台「运营工作台」的素材框
 *   3. AI 自动生成三平台发布文案并存草稿
 * （后续可在脚本里加 --push 自动推送到内容中心草稿，接口已就绪）
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from './sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'data', 'feeds');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const args = { only: null, days: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--only') args.only = argv[++i];
    if (argv[i] === '--days') args.days = Number(argv[++i]);
  }
  return args;
}

/** HTML 实体解码（标题里常见的 &amp; 等） */
function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** 相对链接 → 绝对链接 */
function toAbsoluteUrl(href, base) {
  if (/^https?:\/\//.test(href)) return href;
  if (href.startsWith('/')) {
    const origin = new URL(base).origin;
    return origin + href;
  }
  // ./xxx 或 ../xxx：基于页面路径拼接
  const url = new URL(href, base);
  return url.href;
}

/** 从链接提取日期（支持 /2026/6/29/ 与 t20261017_ 两种） */
function extractDate(href) {
  const m1 = href.match(/\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
  if (m1) {
    const [, y, mo, d] = m1;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const m2 = href.match(/\/t(\d{4})(\d{2})(\d{2})_/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSource(source, days) {
  const started = Date.now();
  try {
    const html = await fetchHtml(source.url);
    const items = [];
    const seen = new Set();
    const patterns = source.linkPatterns ?? [source.linkPattern];
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, 'g');
      let match;
      while ((match = re.exec(html)) !== null) {
      const [, href, rawTitle] = match;
      const title = decodeEntities(rawTitle);
      // 过滤导航/脚本/无关链接
      if (/javascript:|^#|\.css|\.js|\.ico/.test(href)) continue;
      if (!source.keywords.some((keyword) => title.includes(keyword))) continue;
      const url = toAbsoluteUrl(href, source.url);
      if (seen.has(url)) continue;
      seen.add(url);
      const date = extractDate(href);
      if (days && date) {
        const age = (Date.now() - new Date(date).getTime()) / 86400000;
        if (age > days || age < -1) continue;
      }
      items.push({ title, url, date });
      if (items.length >= source.limit) break;
      }
    }
    return {
      id: source.id,
      name: source.name,
      ok: true,
      count: items.length,
      items,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      id: source.id,
      name: source.name,
      ok: false,
      count: 0,
      items: [],
      error: (error).message,
      ms: Date.now() - started,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const targets = args.only
    ? SOURCES.filter((s) => s.id === args.only)
    : SOURCES;
  if (targets.length === 0) {
    console.error(`没有匹配的信源: ${args.only}`);
    process.exit(1);
  }

  console.log(`开始抓取 ${targets.length} 个信源${args.days ? `（仅最近 ${args.days} 天）` : ''}...`);
  const results = [];
  for (const source of targets) {
    process.stdout.write(`  ${source.name} ... `);
    const result = await fetchSource(source, args.days);
    results.push(result);
    console.log(
      result.ok ? `✓ ${result.count} 条 (${result.ms}ms)` : `✗ ${result.error} (${result.ms}ms)`,
    );
    // 信源间限流，礼貌抓取
    if (targets.length > 1) await new Promise((r) => setTimeout(r, 1200));
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    date: today,
    fetchedAt: new Date().toISOString(),
    sources: results,
  };
  await mkdir(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${today}.json`);
  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf-8');

  const total = results.reduce((sum, r) => sum + r.count, 0);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n完成：共 ${total} 条，${failed} 个信源失败`);
  console.log(`输出：${outPath.replace(ROOT + '/', '')}`);

  // 样例预览
  const sample = results.find((r) => r.ok && r.count > 0);
  if (sample) {
    console.log(`\n样例（${sample.name}）：`);
    for (const item of sample.items.slice(0, 5)) {
      console.log(`  [${item.date ?? '未知日期'}] ${item.title}`);
    }
  }
}

main();
