/**
 * 中文 2-gram 词面匹配工具（检索与记忆取回共用）。
 *
 * 为什么是 bigram：中文没有空格分词，ilike %整句% 与空格分词在中文问句上全失效；
 * 相邻两字字符对是零依赖的最强词面信号（升级路径：pg_trgm / embedding）。
 * 标点（全角？/：/、等）不承载词面信息——留在查询里会稀释覆盖率，
 * 实测同一问句带不带结尾「？」分差 0.0067，曾把边界条目从应答打成拒答。
 */

/** 中文 2-gram：相邻字符对（剔除空白与标点） */
export function bigrams(text: string): Set<string> {
  const t = text.replace(/[\s\p{P}\p{S}]+/gu, '');
  const grams = new Set<string>();
  for (let i = 0; i < t.length - 1; i += 1) grams.add(t.slice(i, i + 2));
  return grams;
}

/** 查询侧覆盖率：查询 bigram 被目标文本覆盖的比例（0-1） */
export function coverage(queryGrams: Set<string>, text: string): number {
  if (queryGrams.size === 0) return 0;
  const doc = bigrams(text);
  let hit = 0;
  for (const gram of queryGrams) {
    if (doc.has(gram)) hit += 1;
  }
  return hit / queryGrams.size;
}
