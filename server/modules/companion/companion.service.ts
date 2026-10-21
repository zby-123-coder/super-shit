import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { aiMemory, aiMessage, aiSession, appProfile, wrongQuestion } from '@server/database/schema';
import { AiService } from '@server/common/ai/ai.service';
import { AiInvocationService } from '../ai/ai-invocation.service';
import { AccountService } from '../account/account.service';
import {
  GUIDE_PERSONA,
  STAGE_LABEL,
  buildSystemPrompt,
  type CompanionStage,
} from './persona';

type SessionRow = typeof aiSession.$inferSelect;
type MessageRow = typeof aiMessage.$inferSelect;

export interface SessionDTO {
  id: string;
  studentUserId: string;
  stage: CompanionStage;
  stageLabel: string;
  status: string;
  topic: string;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  role: string;
  content: string;
  stage: string;
  createdAt: string;
}

/** start 返回：resolved=true 表示复用了历史会话（本次没有产生 AI 调用） */
export interface StartResult {
  session: SessionDTO;
  messages: MessageDTO[];
  resolved: boolean;
  callMeta?: { callId: string | null; latencyMs: number; provider: string; available: boolean };
}

/**
 * AI 陪伴（引导师 Agent）。
 *
 * 数据隔离三条铁律：
 *   1. 会话强绑定 studentUserId，创建/读取都先过权限校验
 *   2. prompt 只注入当前学生本人的错题信息，绝不含其他学生数据
 *   3. 老师只能看自己带班学生的会话；家长只读自己孩子的会话
 */
@Injectable()
export class CompanionService {
  private readonly logger = new Logger(CompanionService.name);
  /** 阶段推进顺序（服务端校验，防止模型跳阶段） */
  private readonly stageOrder: CompanionStage[] = [
    'understand',
    'guide',
    'consolidate',
    'close',
  ];

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
    private readonly accountService: AccountService,
    private readonly invocationService: AiInvocationService,
  ) {}

  private async studentName(userId: string): Promise<string> {
    const rows = await this.db
      .select({ name: appProfile.name })
      .from(appProfile)
      .where(eq(appProfile.userId, userId))
      .limit(1);
    return rows[0]?.name ?? '同学';
  }

  /** 权限：学生本人 / 带班老师 / 家长 / 管理员 */
  private async assertCanAccess(userId: string, studentUserId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    if (me.role === 'admin') return;
    if (me.role === 'student') {
      if (userId !== studentUserId) throw new ForbiddenException('只能访问自己的对话');
      return;
    }
    if (me.role === 'parent') {
      const ok = await this.accountService.canViewStudent(userId, studentUserId);
      if (!ok) throw new ForbiddenException('只能查看自己孩子的对话');
      return;
    }
    const ok = await this.accountService.canTeachStudent(userId, studentUserId);
    if (!ok) throw new ForbiddenException('只能查看自己学生的对话');
  }

  private toSessionDTO(row: SessionRow): SessionDTO {
    const stage = row.stage as CompanionStage;
    return {
      id: row.id,
      studentUserId: row.studentUserId,
      stage,
      stageLabel: STAGE_LABEL[stage] ?? stage,
      status: row.status,
      topic: row.topic ?? '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * 开始会话：优先基于一道错题，人设固定为引导师。
   *
   * 幂等设计（解决"重复调用/切走再回来又重算"）：
   *   同一道错题若已有 active 会话，直接续用并返回历史消息，**不再调用 AI 生成开场白**。
   *   只有真正没有会话时才新建 + 生成开场白（resolved=false 供前端提示）。
   */
  async start(
    userId: string,
    input: { studentUserId?: string; wrongQuestionId?: string },
  ): Promise<StartResult> {
    const target = input.studentUserId || userId;
    await this.assertCanAccess(userId, target);

    let topic = '学习引导';
    let questionInfo: { title: string; knowledgePoint?: string; wrongReason?: string } | undefined;
    if (input.wrongQuestionId) {
      // 复用：该错题已有进行中的会话 → 直接续聊（省一次 AI 调用）
      const existing = await this.db
        .select()
        .from(aiSession)
        .where(
          and(
            eq(aiSession.studentUserId, target),
            eq(aiSession.wrongQuestionId, input.wrongQuestionId),
            eq(aiSession.status, 'active'),
          ),
        )
        .orderBy(desc(aiSession.createdAt))
        .limit(1);
      if (existing.length > 0) {
        const sessionRow = existing[0];
        const messages = await this.db
          .select()
          .from(aiMessage)
          .where(eq(aiMessage.sessionId, sessionRow.id))
          .orderBy(asc(aiMessage.createdAt))
          .limit(100);
        return {
          session: this.toSessionDTO(sessionRow),
          messages: messages.map((row) => ({
            id: row.id,
            role: row.role,
            content: row.content,
            stage: row.stageAtTime ?? sessionRow.stage,
            createdAt: row.createdAt.toISOString(),
          })),
          resolved: true,
        };
      }

      const rows = await this.db
        .select()
        .from(wrongQuestion)
        .where(eq(wrongQuestion.id, input.wrongQuestionId))
        .limit(1);
      if (rows.length === 0) throw new NotFoundException('错题不存在');
      const wq = rows[0];
      // 数据隔离：错题必须属于这名学生
      if (wq.studentUserId !== target) {
        throw new ForbiddenException('该错题不属于此学生');
      }
      topic = wq.title.slice(0, 60);
      questionInfo = {
        title: wq.title,
        knowledgePoint: wq.knowledgePoint ?? undefined,
        wrongReason: wq.reason ?? undefined,
      };
    }

    const inserted = await this.db
      .insert(aiSession)
      .values({
        studentUserId: target,
        wrongQuestionId: input.wrongQuestionId ?? null,
        personaId: GUIDE_PERSONA.id,
        stage: 'understand',
        topic,
      })
      .returning();
    const session = inserted[0];

    const name = await this.studentName(target);
    const memories = await this.loadMemories(target);
    const systemPrompt = buildSystemPrompt(GUIDE_PERSONA, 'understand', name, questionInfo, memories);
    const started = Date.now();
    const opening = await this.aiService.companionReply({
      systemPrompt,
      history: [],
      message: '（学生刚进入对话，请你先开口，用一个问题了解他卡在哪里）',
      stage: 'understand',
    });

    const openingMessage = await this.db
      .insert(aiMessage)
      .values({
        sessionId: session.id,
        role: 'assistant',
        content: opening.reply,
        stageAtTime: 'understand',
      })
      .returning();

    // 开场白也是一次真实 AI 调用 → 留痕（复用历史会话时不会走到这里）
    const caller = await this.accountService.findProfile(userId);
    const callId = await this.invocationService.record(
      { userId, role: caller?.role, feature: 'companion', scopeType: 'session', scopeId: session.id },
      {
        provider: this.aiService.providerName,
        status: opening.available ? 'success' : 'degraded',
        latencyMs: Date.now() - started,
        preview: opening.reply,
      },
    );

    return {
      session: this.toSessionDTO(session),
      messages: [
        {
          id: openingMessage[0].id,
          role: 'assistant',
          content: openingMessage[0].content,
          stage: openingMessage[0].stageAtTime ?? 'understand',
          createdAt: openingMessage[0].createdAt.toISOString(),
        },
      ],
      resolved: false,
      callMeta: {
        callId,
        latencyMs: Date.now() - started,
        provider: this.aiService.providerName,
        available: opening.available,
      },
    };
  }

  // ===== 记忆系统（跨会话，严格按学生隔离） =====

  /** 读取该学生的记忆（注入 prompt 用，取重要度最高的 5 条） */
  private async loadMemories(studentUserId: string) {
    const rows = await this.db
      .select({ content: aiMemory.content, kind: aiMemory.kind, importance: aiMemory.importance })
      .from(aiMemory)
      .where(eq(aiMemory.studentUserId, studentUserId))
      .orderBy(desc(aiMemory.importance), desc(aiMemory.updatedAt))
      .limit(5);
    return rows;
  }

  /** 记忆卡（前端展示，权限复用 assertCanAccess） */
  async memory(userId: string, studentUserId?: string) {
    const target = studentUserId || userId;
    await this.assertCanAccess(userId, target);
    const rows = await this.db
      .select()
      .from(aiMemory)
      .where(eq(aiMemory.studentUserId, target))
      .orderBy(desc(aiMemory.importance), desc(aiMemory.updatedAt))
      .limit(20);
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      content: row.content,
      importance: row.importance,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  /**
   * 刷新记忆（规则提炼，不额外消耗 LLM 调用）：
   *   薄弱点 = 高频错因；进度 = 高频考点；事实 = 错题数量统计。
   * 同一条记忆 upsert，不会重复膨胀。
   */
  async refreshMemory(studentUserId: string): Promise<void> {
    try {
      const rows = await this.db
        .select({ reason: wrongQuestion.reason, knowledgePoint: wrongQuestion.knowledgePoint })
        .from(wrongQuestion)
        .where(eq(wrongQuestion.studentUserId, studentUserId))
        .limit(200);

      const candidates: { kind: string; content: string; importance: number }[] = [];
      const byReason = new Map<string, number>();
      const byPoint = new Map<string, number>();
      for (const row of rows) {
        if (row.reason) byReason.set(row.reason, (byReason.get(row.reason) ?? 0) + 1);
        if (row.knowledgePoint) byPoint.set(row.knowledgePoint, (byPoint.get(row.knowledgePoint) ?? 0) + 1);
      }
      const topReason = [...byReason.entries()].sort((a, b) => b[1] - a[1])[0];
      const topPoint = [...byPoint.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topReason && topReason[1] >= 2) {
        candidates.push({
          kind: 'weakness',
          content: `高频错因是「${topReason[0]}」，需要重点纠正`,
          importance: 5,
        });
      }
      if (topPoint && topPoint[1] >= 2) {
        candidates.push({
          kind: 'progress',
          content: `近期反复出现在「${topPoint[0]}」这个考点上`,
          importance: 4,
        });
      }
      if (rows.length >= 5) {
        candidates.push({
          kind: 'fact',
          content: `错题本累计 ${rows.length} 道错题，最近在学习主动提问`,
          importance: 2,
        });
      }
      for (const item of candidates) {
        await this.db
          .insert(aiMemory)
          .values({ studentUserId, kind: item.kind, content: item.content, importance: item.importance, source: 'rule' })
          .onConflictDoUpdate({
            target: [aiMemory.studentUserId, aiMemory.content],
            set: { importance: item.importance, updatedAt: new Date() },
          });
      }
    } catch (error) {
      this.logger.warn(`记忆刷新失败（忽略）：${(error as Error).message}`);
    }
  }

  /** 继续对话：写入学生消息 → 调 AI → 落库回复 → 校验并推进阶段 */
  async send(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<{ messages: MessageDTO[]; session: SessionDTO; callMeta: { callId: string | null; latencyMs: number; provider: string; available: boolean } }> {
    const sessions = await this.db
      .select()
      .from(aiSession)
      .where(eq(aiSession.id, sessionId))
      .limit(1);
    if (sessions.length === 0) throw new NotFoundException('会话不存在');
    const session = sessions[0];
    await this.assertCanAccess(userId, session.studentUserId);
    if (session.status !== 'active') {
      throw new ForbiddenException('会话已结束，请重新开始');
    }

    // 历史（仅本会话，天然隔离）
    const history = await this.db
      .select()
      .from(aiMessage)
      .where(eq(aiMessage.sessionId, sessionId))
      .orderBy(asc(aiMessage.createdAt))
      .limit(40);

    // 落库学生消息
    const userMessage = await this.db
      .insert(aiMessage)
      .values({ sessionId, role: 'user', content, stageAtTime: session.stage })
      .returning();

    const name = await this.studentName(session.studentUserId);
    let questionInfo: { title: string; knowledgePoint?: string; wrongReason?: string } | undefined;
    if (session.wrongQuestionId) {
      const rows = await this.db
        .select()
        .from(wrongQuestion)
        .where(eq(wrongQuestion.id, session.wrongQuestionId))
        .limit(1);
      if (rows.length > 0) {
        questionInfo = {
          title: rows[0].title,
          knowledgePoint: rows[0].knowledgePoint ?? undefined,
          wrongReason: rows[0].reason ?? undefined,
        };
      }
    }

    const stage = session.stage as CompanionStage;
    // 记忆注入：跨会话累积的学生画像（仅本人）
    const memories = await this.loadMemories(session.studentUserId);
    const systemPrompt = buildSystemPrompt(GUIDE_PERSONA, stage, name, questionInfo, memories);
    const started = Date.now();
    const result = await this.aiService.companionReply({
      systemPrompt,
      history: history.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      message: content,
      stage,
    });

    // 阶段推进：只允许前进一格，防模型跳阶段
    let nextStage = stage;
    if (result.nextStage) {
      const currentIndex = this.stageOrder.indexOf(stage);
      const suggestedIndex = this.stageOrder.indexOf(result.nextStage as CompanionStage);
      if (suggestedIndex === currentIndex + 1) {
        nextStage = result.nextStage as CompanionStage;
      }
    }

    const assistantMessage = await this.db
      .insert(aiMessage)
      .values({
        sessionId,
        role: 'assistant',
        content: result.reply,
        stageAtTime: nextStage,
      })
      .returning();

    const updated = await this.db
      .update(aiSession)
      .set({
        stage: nextStage,
        status: nextStage === 'close' ? 'closed' : 'active',
      })
      .where(eq(aiSession.id, sessionId))
      .returning();

    // 调用留痕（归属发起对话的人，便于他在"我的调用历史"里回看）+ 记忆刷新
    const caller = await this.accountService.findProfile(userId);
    const callId = await this.invocationService.record(
      {
        userId,
        role: caller?.role,
        feature: 'companion',
        scopeType: 'session',
        scopeId: sessionId,
      },
      {
        provider: this.aiService.providerName,
        status: result.available ? 'success' : 'degraded',
        latencyMs: Date.now() - started,
        preview: result.reply,
      },
    );
    await this.refreshMemory(session.studentUserId);

    return {
      messages: [
        {
          id: userMessage[0].id,
          role: 'user',
          content: userMessage[0].content,
          stage: userMessage[0].stageAtTime ?? stage,
          createdAt: userMessage[0].createdAt.toISOString(),
        },
        {
          id: assistantMessage[0].id,
          role: 'assistant',
          content: assistantMessage[0].content,
          stage: assistantMessage[0].stageAtTime ?? nextStage,
          createdAt: assistantMessage[0].createdAt.toISOString(),
        },
      ],
      session: this.toSessionDTO(updated[0]),
      callMeta: {
        callId,
        latencyMs: Date.now() - started,
        provider: this.aiService.providerName,
        available: result.available,
      },
    };
  }

  /** 会话列表（按学生过滤，权限校验后返回；含消息数与最后活跃时间，便于前端展示"历史"） */
  async listSessions(
    userId: string,
    studentUserId?: string,
  ): Promise<(SessionDTO & { messageCount: number; lastActiveAt: string; wrongQuestionId: string | null })[]> {
    const target = studentUserId || userId;
    await this.assertCanAccess(userId, target);
    const rows = await this.db
      .select()
      .from(aiSession)
      .where(eq(aiSession.studentUserId, target))
      .orderBy(desc(aiSession.createdAt))
      .limit(30);
    if (rows.length === 0) return [];

    // 一次性统计消息数与最后活跃时间（避免逐会话查询）
    // 注意：sql 聚合表达式不走列类型映射，count/max 运行时可能是 string，需显式转换
    const stats = await this.db
      .select({
        sessionId: aiMessage.sessionId,
        count: sql<number>`count(*)::int`,
        lastAt: sql<string>`max(${aiMessage.createdAt})`,
      })
      .from(aiMessage)
      .where(inArray(aiMessage.sessionId, rows.map((row) => row.id)))
      .groupBy(aiMessage.sessionId);
    const statMap = new Map(stats.map((s) => [s.sessionId, s]));

    return rows.map((row) => {
      const stat = statMap.get(row.id);
      const lastAt = stat?.lastAt ? new Date(stat.lastAt) : row.createdAt;
      return {
        ...this.toSessionDTO(row),
        messageCount: Number(stat?.count ?? 0),
        lastActiveAt: lastAt.toISOString(),
        wrongQuestionId: row.wrongQuestionId ?? null,
      };
    });
  }

  /** 会话消息（权限校验后返回） */
  async listMessages(userId: string, sessionId: string): Promise<MessageDTO[]> {
    const sessions = await this.db
      .select()
      .from(aiSession)
      .where(eq(aiSession.id, sessionId))
      .limit(1);
    if (sessions.length === 0) throw new NotFoundException('会话不存在');
    await this.assertCanAccess(userId, sessions[0].studentUserId);
    const rows = await this.db
      .select()
      .from(aiMessage)
      .where(eq(aiMessage.sessionId, sessionId))
      .orderBy(asc(aiMessage.createdAt));
    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      stage: row.stageAtTime ?? '',
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
