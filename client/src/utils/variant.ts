/**
 * 举一反三（规则版）：把题干中的数字做同量级替换，生成一道变式。
 * 非算术题返回 null —— 不假装 AI 万能，交给老师人工出题。
 */
export function generateVariant(title: string): string | null {
  const numbers = title.match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  const used = new Set<string>();
  return title.replace(/\d+(\.\d+)?/g, (match) => {
    const value = Number(match);
    if (!Number.isFinite(value) || value <= 0) return match;
    let next = value;
    for (let i = 0; i < 8; i += 1) {
      const delta = Math.max(1, Math.round(value * 0.2));
      next = value + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * delta));
      if (next > 0 && !used.has(String(next))) break;
    }
    used.add(String(next));
    return Number.isInteger(value) ? String(next) : next.toFixed(1);
  });
}
