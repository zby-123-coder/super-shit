import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { aiMessage, aiSession, appProfile, wrongQuestion } from '@server/database/schema';
import { AiService } from '@server/common/ai/ai.service';
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

  /** 开始会话：优先基于一道错题，人设固定为引导师 */
  async start(
    userId: string,
    input: { studentUserId?: string; wrongQuestionId?: string },
  ): Promise<{ session: SessionDTO; messages: MessageDTO[] }> {
    const target = input.studentUserId || userId;
    await this.assertCanAccess(userId, target);

    let topic = '学习引导';
    let questionInfo: { title: string; knowledgePoint?: string; wrongReason?: string } | undefined;
    if (input.wrongQuestionId) {
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
    const systemPrompt = buildSystemPrompt(GUIDE_PERSONA, 'understand', name, questionInfo);
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
    };
  }

  /** 继续对话：写入学生消息 → 调 AI → 落库回复 → 校验并推进阶段 */
  async send(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<{ messages: MessageDTO[]; session: SessionDTO }> {
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
    const systemPrompt = buildSystemPrompt(GUIDE_PERSONA, stage, name, questionInfo);
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
    };
  }

  /** 会话列表（按学生过滤，权限校验后返回） */
  async listSessions(
    userId: string,
    studentUserId?: string,
  ): Promise<SessionDTO[]> {
    const target = studentUserId || userId;
    await this.assertCanAccess(userId, target);
    const rows = await this.db
      .select()
      .from(aiSession)
      .where(eq(aiSession.studentUserId, target))
      .orderBy(desc(aiSession.createdAt))
      .limit(30);
    return rows.map((row) => this.toSessionDTO(row));
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
