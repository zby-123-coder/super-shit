import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { aiMemory, aiMessage, appProfile } from '@server/database/schema';
import { bigrams, coverage } from '@server/common/text/bigrams';
import { AiService } from '@server/common/ai/ai.service';
import { AiInvocationService } from '../ai/ai-invocation.service';
import type { CompanionMemoryOp } from '@server/common/ai/ai.types';

type MemoryRow = typeof aiMemory.$inferSelect;
interface SessionRowLike {
  id: string;
  studentUserId: string;
  stage: string;
}

/** 会话沉默达 30 分钟视为一段学习结束 → 下次发言时触发影子总结（异步并行，为下一段对话准备）。
 *  懒触发（骑在用户消息请求上，不搞定时器）——符合「绝不自动调 AI」铁律 */
const SILENCE_TRIGGER_MS = 30 * 60 * 1000;
/** 注入 prompt 的记忆条数 */
export const RETRIEVE_LIMIT = 5;
/** 时间衰减半衰期（天）：7 天没被更新的记忆，时间权重减半 */
const HALF_LIFE_DAYS = 7;
/** 会话上下文缓存有效期：超过即视为进入新的对话段，重建（与沉默阈值对齐——
 *  段内对话保持稳定，调整只发生在段之间的非对话时期） */
const CONTEXT_TTL_MS = 30 * 60 * 1000;

const MEMORY_KINDS = new Set(['weakness', 'preference', 'style', 'progress', 'fact']);

/** 取回后的记忆（带综合得分，调试/评测可回指） */
export interface RetrievedMemory {
  id: string;
  kind: string;
  content: string;
  importance: number;
  score: number;
  updatedAt: string;
}

export type TeachingDepth = 'fast' | 'standard' | 'slow';

/**
 * 因材施教卡：非固定，随记忆演进（影子 agent 更新 style/preference 记忆 → 卡片随之变）。
 * buildSystemPrompt 按当前阶段把卡片拼进 system prompt——轮转到新阶段即整段替换。
 */
export interface TeachingCard {
  depth: TeachingDepth;
  /** 注入 prompt 的卡片行（学生偏好原文 + 节奏指令） */
  lines: string[];
}

/** 记忆重排（纯函数，评测脚本可对拍）：词面相关 0.5 × 重要度 0.3 × 时间衰减 0.2 */
export function rankMemories(
  rows: Pick<MemoryRow, 'id' | 'kind' | 'content' | 'importance' | 'updatedAt'>[],
  query: string,
  limit: number,
): RetrievedMemory[] {
  const q = bigrams(query);
  const now = Date.now();
  const scored = rows.map((row) => {
    const rel = q.size > 0 ? coverage(q, row.content) : 0;
    const imp = row.importance / 5;
    const ageDays = Math.max(0, (now - row.updatedAt.getTime()) / 86400000);
    const recency = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    return {
      id: row.id,
      kind: row.kind,
      content: row.content,
      importance: row.importance,
      score: 0.5 * rel + 0.3 * imp + 0.2 * recency,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
  scored.sort((a, b) => b.score - a.score || b.importance - a.importance);
  const top = scored.slice(0, limit);
  // 画像常驻：沟通风格/偏好（重要度≥4）若没进 top，替换最后一个名额——
  // 因材施教靠它，被普通相关记忆挤掉就失灵
  const hasProfile = top.some((m) => m.importance >= 4 && (m.kind === 'style' || m.kind === 'preference'));
  if (!hasProfile && top.length > 0) {
    const profile = scored
      .slice(limit)
      .find((m) => m.importance >= 4 && (m.kind === 'style' || m.kind === 'preference'));
    if (profile) top[top.length - 1] = profile;
  }
  return top;
}

/** 因材施教卡推导（纯函数）：style/preference 记忆原文 + 规则信号推节奏 */
export function deriveCardFromMemories(
  rows: Pick<MemoryRow, 'kind' | 'content' | 'importance'>[],
): TeachingCard {
  const profileLines = rows
    .filter((r) => (r.kind === 'style' || r.kind === 'preference') && r.importance >= 3)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
    .map((r) => r.content);
  // 节奏信号：理解速度类描述散落在 progress/style/fact 记忆里，用词面规则识别
  const allText = rows.map((r) => r.content).join(' ');
  let depth: TeachingDepth = 'standard';
  if (/秒懂|一点就通|理解快|接受快|反应快|基础扎实|掌握快|悟性/.test(allText)) depth = 'fast';
  if (/需要多遍|反复讲|讲了好几遍|理解慢|跟不上|基础薄弱|总是卡/.test(allText)) depth = 'slow';
  const depthNote =
    depth === 'fast'
      ? '该学生理解较快：讲题节奏可以紧凑些，简单步骤一带而过，多留挑战空间'
      : depth === 'slow'
        ? '该学生需要更多耐心：把步骤拆得更碎，每步确认跟上了再继续，多用具体例子'
        : '按正常节奏引导，先让学生自己尝试再给提示';
  return { depth, lines: [...profileLines, depthNote] };
}

/**
 * 小引影子记忆员（跨会话长期记忆）。
 *
 * 设计（调整节点在 session 之后的非对话时期，对话段内保持稳定）：
 *   1. 影子总结触发点只有两个（≈每段对话至多 1-2 次 LLM 调用，异步并行不阻塞回复）：
 *      会话收尾一次；沉默 ≥30min 后下次发言时一次。总结出的记忆「让下一次对话更好用」
 *   2. 上下文（取回记忆+因材施教卡）按会话段缓存：段首算一次，段内所有 send 复用——
 *      每次重建的只有阶段块（纯字符串拼接）。影子总结落库后失效缓存，下一段生效
 *   3. 影子 agent（LLM）只提「操作建议」，落库由固定规则裁决：
 *      update = 时间新者胜（旧条 superseded 指向新条，可回溯时间链）；
 *      add 撞内容唯一约束 = 同一事实再确认（刷 updatedAt/importance，不膨胀）
 *   4. 取回 = bigram 词面相关 × 重要度 × 时间衰减 + 画像常驻保底；
 *      「之前讲过的题」靠 progress/fact 记忆的题面 bigram 自然命中
 *   5. 数据隔离：所有读写都带 studentUserId 条件（与方法参数强绑定）
 */
@Injectable()
export class CompanionMemoryService {
  private readonly logger = new Logger(CompanionMemoryService.name);
  /** 会话段上下文缓存（段首构建、段内复用；影子总结落库后失效） */
  private readonly contextCache = new Map<
    string,
    { memories: RetrievedMemory[]; card: TeachingCard; cachedAt: number }
  >();

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
    private readonly invocationService: AiInvocationService,
  ) {}

  /** 该生全部生效记忆（小数据量一次拉全 ≤200 行，取回与卡片同源，省一次查询） */
  private async activeMemories(studentUserId: string): Promise<MemoryRow[]> {
    return this.db
      .select()
      .from(aiMemory)
      .where(and(eq(aiMemory.studentUserId, studentUserId), eq(aiMemory.status, 'active')))
      .orderBy(desc(aiMemory.importance), desc(aiMemory.updatedAt))
      .limit(200);
  }

  /** RAG 记忆取回（词面相关 × 重要度 × 时间衰减 + 画像常驻保底） */
  async retrieve(studentUserId: string, query: string, limit = RETRIEVE_LIMIT): Promise<RetrievedMemory[]> {
    const rows = await this.activeMemories(studentUserId);
    const top = rankMemories(rows, query, limit);
    if (top.length === 0) return [];
    // 命中计数（fire-and-forget：被用过的记忆 hits+1，运营侧看哪些记忆真的在工作）
    void this.db
      .update(aiMemory)
      .set({ hits: sql`${aiMemory.hits} + 1` })
      .where(and(eq(aiMemory.studentUserId, studentUserId), inArray(aiMemory.id, top.map((m) => m.id))))
      .catch((err: unknown) => this.logger.warn(`记忆 hits 更新失败（忽略）：${String(err)}`));
    return top;
  }

  /** 取回 + 因材施教卡（send 一次拿全，共享同一次 DB 查询） */
  async contextFor(
    studentUserId: string,
    query: string,
  ): Promise<{ memories: RetrievedMemory[]; card: TeachingCard }> {
    const rows = await this.activeMemories(studentUserId);
    return {
      memories: rankMemories(rows, query, RETRIEVE_LIMIT),
      card: deriveCardFromMemories(rows),
    };
  }

  /**
   * 会话段上下文（带缓存）：段首算一次（start / 沉默后的首条消息），段内所有 send 复用。
   * 段锚点 = 绑定的题目标题 / 会话主题（会话按题绑定是主场景，单段单话题，
   * 按消息逐条重取回只会白烧查询——相关性的粒度应该是「段」不是「句」）。
   * TTL 过期或影子总结落库后失效，下一段对话用上最新画像。
   */
  async contextForSession(
    session: SessionRowLike,
    query: string,
  ): Promise<{ memories: RetrievedMemory[]; card: TeachingCard }> {
    const hit = this.contextCache.get(session.id);
    if (hit && Date.now() - hit.cachedAt < CONTEXT_TTL_MS) return hit;
    const context = await this.contextFor(session.studentUserId, query);
    this.contextCache.set(session.id, { ...context, cachedAt: Date.now() });
    this.pruneContextCache();
    return context;
  }

  /** 缓存有界：超 200 个会话段时淘汰最旧的一半（防长驻进程缓慢泄漏） */
  private pruneContextCache(): void {
    if (this.contextCache.size <= 200) return;
    const entries = [...this.contextCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    for (const [id] of entries.slice(0, entries.length - 100)) this.contextCache.delete(id);
  }

  /** 记忆卡读取（前端展示；默认只给 active，includeSuperseded=true 时带被取代的历史链） */
  async listFor(studentUserId: string, includeSuperseded = false) {
    const rows = includeSuperseded
      ? await this.db
          .select()
          .from(aiMemory)
          .where(eq(aiMemory.studentUserId, studentUserId))
          .orderBy(desc(aiMemory.importance), desc(aiMemory.updatedAt))
          .limit(50)
      : await this.activeMemories(studentUserId);
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      content: row.content,
      importance: row.importance,
      source: row.source ?? '',
      status: row.status,
      supersededBy: row.supersededBy ?? null,
      hits: row.hits,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  /**
   * 影子总结一个会话（永不 throw——观测/记忆是辅助线，绝不能挂掉主对话）。
   * triggeredBy = 归属的发起人（留痕用；沉默/轮次触发=发消息的人，手动触发=点按钮的人）。
   * 返回落库的记忆操作数（0 = 无可记 / 影子 agent 缺位）。
   */
  async summarizeSession(session: SessionRowLike, triggeredBy?: string): Promise<number> {
    try {
      const messages = await this.db
        .select({ role: aiMessage.role, content: aiMessage.content })
        .from(aiMessage)
        .where(eq(aiMessage.sessionId, session.id))
        .orderBy(desc(aiMessage.createdAt))
        .limit(40);
      if (messages.length === 0) return 0;
      const transcripts = messages.reverse(); // 时间正序
      if (!transcripts.some((m) => m.role === 'user')) return 0;

      const nameRows = await this.db
        .select({ name: appProfile.name })
        .from(appProfile)
        .where(eq(appProfile.userId, session.studentUserId))
        .limit(1);
      const existing = await this.activeMemories(session.studentUserId);

      const started = Date.now();
      const result = await this.aiService.companionMemorySummary({
        studentName: nameRows[0]?.name ?? '同学',
        stage: session.stage,
        transcripts,
        existingMemories: existing.map((m) => ({
          id: m.id,
          kind: m.kind,
          content: m.content,
          importance: m.importance,
        })),
      });
      const applied = await this.applyOps(session.studentUserId, result.ops, session.id);
      // 有新记忆落库 → 失效该会话段的上下文缓存（下一段对话用上最新画像）
      if (applied > 0) this.contextCache.delete(session.id);
      // 每次影子调用留痕（铁律），归属触发人；ops 全文进 result_full 供回看
      if (triggeredBy) {
        await this.invocationService.record(
          {
            userId: triggeredBy,
            feature: 'companion-memory',
            scopeType: 'session',
            scopeId: session.id,
          },
          {
            provider: this.aiService.providerName,
            status: result.available ? 'success' : 'degraded',
            latencyMs: Date.now() - started,
            preview: result.ops.map((op) => `${op.action}:${op.kind}:${op.content.slice(0, 40)}`).join(' | ') || '（无可记）',
            full: {
              available: result.available,
              ops: result.ops,
              applied,
              transcripts: transcripts.length,
              existingMemories: existing.length,
            },
          },
        );
      }
      this.logger.log(
        `影子总结完成：session=${session.id} ops=${result.ops.length} applied=${applied} available=${result.available}`,
      );
      return applied;
    } catch (error) {
      this.logger.warn(`影子总结失败（忽略，不影响对话）：${(error as Error).message}`);
      return 0;
    }
  }

  /**
   * 固定规则裁决落库（影子 agent 只有建议权）：
   *   update → 时间新者胜：旧条 status=superseded + supersededBy 指向新条（时间链可回溯）
   *   add    → 内容唯一约束兜底：同内容重复 = 再确认，刷 importance/updatedAt 不膨胀
   * 全程校验 kind 白名单 + 记忆归属（防跨学生写 id）。
   */
  async applyOps(studentUserId: string, ops: CompanionMemoryOp[], sessionId: string): Promise<number> {
    let applied = 0;
    for (const op of ops) {
      try {
        const content = op.content.trim().slice(0, 500);
        if (!content || !MEMORY_KINDS.has(op.kind)) continue;
        const importance = Math.max(1, Math.min(5, Math.round(Number(op.importance) || 3)));

        if (op.action === 'update' && op.targetId) {
          // 归属双重校验：目标记忆必须属于这个学生
          const target = await this.db
            .select()
            .from(aiMemory)
            .where(and(eq(aiMemory.id, op.targetId), eq(aiMemory.studentUserId, studentUserId)))
            .limit(1);
          if (target.length === 0) continue;
          if (target[0].content === content) {
            // 同一事实换了个说法都没变：刷热度即可，不产生新条目
            await this.db
              .update(aiMemory)
              .set({ importance, updatedAt: new Date() })
              .where(eq(aiMemory.id, target[0].id));
            applied += 1;
            continue;
          }
          const inserted = await this.db
            .insert(aiMemory)
            .values({
              studentUserId,
              kind: op.kind,
              content,
              importance,
              source: 'shadow',
              sourceSessionId: sessionId,
            })
            .onConflictDoUpdate({
              target: [aiMemory.studentUserId, aiMemory.content],
              set: { importance, updatedAt: new Date() },
            })
            .returning();
          await this.db
            .update(aiMemory)
            .set({ status: 'superseded', supersededBy: inserted[0].id, updatedAt: new Date() })
            .where(eq(aiMemory.id, target[0].id));
          applied += 1;
        } else {
          await this.db
            .insert(aiMemory)
            .values({
              studentUserId,
              kind: op.kind,
              content,
              importance,
              source: 'shadow',
              sourceSessionId: sessionId,
            })
            .onConflictDoUpdate({
              target: [aiMemory.studentUserId, aiMemory.content],
              set: { importance, updatedAt: new Date() },
            });
          applied += 1;
        }
      } catch (error) {
        this.logger.warn(`记忆操作落库失败（跳过该条）：${(error as Error).message}`);
      }
    }
    return applied;
  }

  /**
   * 触发判断入口：会话沉默 ≥30min 才算「该总结了」。
   * 由 send() 在写入新消息前调用（写完新消息沉默就归零了）。
   */
  async shouldSummarizeForSilence(sessionId: string): Promise<boolean> {
    const last = await this.db
      .select({ createdAt: aiMessage.createdAt })
      .from(aiMessage)
      .where(eq(aiMessage.sessionId, sessionId))
      .orderBy(desc(aiMessage.createdAt))
      .limit(1);
    if (last.length === 0) return false;
    return Date.now() - last[0].createdAt.getTime() >= SILENCE_TRIGGER_MS;
  }
}
