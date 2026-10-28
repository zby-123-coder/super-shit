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

/** 会话沉默达 30 分钟视为一段学习结束 → 下次发言时先触发影子总结。
 *  懒触发（骑在用户消息请求上，不搞定时器）——符合「绝不自动调 AI」铁律 */
const SILENCE_TRIGGER_MS = 30 * 60 * 1000;
/** 会话内每满 N 条学生发言触发一次影子总结（回复完成后异步跑，不阻塞） */
export const SUMMARY_EVERY_N_USER_MSGS = 6;
/** 注入 prompt 的记忆条数 */
export const RETRIEVE_LIMIT = 5;
/** 时间衰减半衰期（天）：7 天没被更新的记忆，时间权重减半 */
const HALF_LIFE_DAYS = 7;

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
 * 设计（对应需求：30min/轮次触发总结 → RAG 取回重排 → 固定规则裁决冲突）：
 *   1. 触发全部懒触发、骑在用户消息请求上（绝不自动调 AI）：
 *      沉默 ≥30min → send 前同步总结（新一段学习的开始，新鲜画像直接参与本次回复）；
 *      每满 6 条学生发言 / 会话收尾 → 回复后异步总结
 *   2. 影子 agent（LLM）只提「操作建议」，落库由固定规则裁决：
 *      update = 时间新者胜（旧条 superseded 指向新条，可回溯时间链）；
 *      add 撞内容唯一约束 = 同一事实再确认（刷 updatedAt/importance，不膨胀）
 *   3. 取回 = bigram 词面相关 × 重要度 × 时间衰减 + 画像常驻保底；
 *      「之前讲过的题」靠 progress/fact 记忆的题面 bigram 自然命中
 *   4. 数据隔离：所有读写都带 studentUserId 条件（与方法参数强绑定）
 */
@Injectable()
export class CompanionMemoryService {
  private readonly logger = new Logger(CompanionMemoryService.name);

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
