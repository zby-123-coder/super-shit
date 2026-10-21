import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { AiService } from '@server/common/ai/ai.service';
import { AiInvocationService } from './ai-invocation.service';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { Inject } from '@nestjs/common';
import { studyTask, taskCheckin } from '@server/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { StorageService } from '@server/common/storage/storage.service';
import { AccountService } from '../account/account.service';

class ReviewDraftDto {
  @IsString()
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @IsString()
  @MaxLength(255)
  taskTitle!: string;
}

class ExplainDto {
  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  knowledgePoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  wrongReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  studentAnswer?: string;
}

class VariantDto {
  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  knowledgePoint?: string;
}

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly storageService: StorageService,
    private readonly accountService: AccountService,
    private readonly invocationService: AiInvocationService,
  ) {}

  /** 当前生效的 AI 提供方（前端可据此提示"AI 已接入/使用规则版"） */
  @Get('status')
  status() {
    return { provider: this.aiService.providerName };
  }

  /** 我的 AI 调用历史（callId / 时间 / 功能 / 耗时 / 提供方），严格按登录用户隔离 */
  @Get('logs')
  logs(@Req() req: Request, @Query('feature') feature?: string, @Query('limit') limit?: string) {
    const { userId } = req.userContext;
    return this.invocationService.list(userId, {
      feature,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('review-draft')
  async reviewDraft(@Req() req: Request, @Body() dto: ReviewDraftDto) {
    const { userId, role } = req.userContext;
    const started = Date.now();
    const draft = await this.aiService.reviewDraft({
      content: dto.content,
      durationMin: dto.durationMin ?? 0,
      taskTitle: dto.taskTitle,
    });
    const callId = await this.invocationService.record(
      { userId, role, feature: 'review_draft', scopeType: 'task_title', scopeId: dto.taskTitle },
      { provider: this.aiService.providerName, status: 'success', latencyMs: Date.now() - started, preview: draft },
    );
    return { draft, callId };
  }

  /**
   * 引导式讲题：读题→提示（不给答案）→分步讲解。
   * 权限：登录用户可用（自己的错题场景），无敏感数据外泄。
   */
  @Post('explain')
  async explain(@Req() req: Request, @Body() dto: ExplainDto) {
    const { userId, role } = req.userContext;
    const started = Date.now();
    const result = await this.aiService.explainQuestion({
      subject: dto.subject,
      title: dto.title,
      knowledgePoint: dto.knowledgePoint,
      wrongReason: dto.wrongReason,
      studentAnswer: dto.studentAnswer,
    });
    const callId = await this.invocationService.record(
      {
        userId,
        role,
        feature: 'explain',
        scopeType: 'question',
        scopeId: `${dto.subject}:${dto.title}`.slice(0, 200),
      },
      {
        provider: this.aiService.providerName,
        status: result.available ? 'success' : 'degraded',
        latencyMs: Date.now() - started,
        preview: result.steps?.[0]?.text,
      },
    );
    return { ...result, callId };
  }

  @Post('variant')
  async variant(@Req() req: Request, @Body() dto: VariantDto) {
    const { userId, role } = req.userContext;
    const started = Date.now();
    const variant = await this.aiService.variant({
      subject: dto.subject,
      title: dto.title,
      knowledgePoint: dto.knowledgePoint,
    });
    const callId = await this.invocationService.record(
      { userId, role, feature: 'variant', scopeType: 'question', scopeId: dto.title.slice(0, 200) },
      { provider: this.aiService.providerName, status: 'success', latencyMs: Date.now() - started, preview: variant ?? undefined },
    );
    return { variant, callId };
  }

  /**
   * 识图批改：读取该任务最新打卡的图片，交给多模态模型逐题批改。
   * 规则版（未配 AI_API_KEY）返回 available:false，前端提示。
   */
  @Post('grade-homework/:taskId')
  async gradeHomework(@Req() req: Request, @Param('taskId') taskId: string) {
    const { userId, role } = req.userContext;
    // 权限：仅管理员或该生的带班老师可批改（杜绝学生自助改分）
    const taskRows = await this.db
      .select({ studentUserId: studyTask.studentUserId })
      .from(studyTask)
      .where(eq(studyTask.id, taskId))
      .limit(1);
    const taskRow = taskRows[0];
    if (!taskRow) {
      return { available: true, items: [], summary: '任务不存在。' };
    }
    if (role !== 'admin') {
      const canTeach = await this.accountService.canTeachStudent(userId, taskRow.studentUserId);
      if (!canTeach) {
        throw new ForbiddenException('只有该生的带班老师或管理员可以批改');
      }
    }
    // 取该任务最近一次带图片的打卡
    const checkins = await this.db
      .select()
      .from(taskCheckin)
      .where(and(eq(taskCheckin.taskId, taskId), eq(taskCheckin.studentUserId, userId)))
      .orderBy(desc(taskCheckin.createdAt))
      .limit(1);
    const checkin = checkins[0];
    if (!checkin || !checkin.imageUrls || checkin.imageUrls.length === 0) {
      return { available: true, items: [], summary: '没有找到带图片的打卡记录。' };
    }
    // 图片 URL → base64 data URL（/api/upload/file/<name>）
    const images: string[] = [];
    for (const url of checkin.imageUrls) {
      const name = url.split('/').pop() ?? '';
      const file = await this.storageService.get(name);
      if (file) {
        images.push(`data:${file.mimetype};base64,${file.content.toString('base64')}`);
      }
    }
    // 从任务表拿科目与标题（批改 prompt 需要）
    const tasks = await this.db
      .select({ subject: studyTask.subject, title: studyTask.title })
      .from(studyTask)
      .where(eq(studyTask.id, taskId))
      .limit(1);
    const taskInfo = tasks[0];
    const started = Date.now();
    const result = await this.aiService.gradeHomework({
      subject: taskInfo?.subject ?? '未指定',
      taskTitle: taskInfo?.title ?? `任务 ${taskId.slice(0, 8)}`,
      images,
      content: checkin.content ?? '',
    });
    const callId = await this.invocationService.record(
      { userId, role, feature: 'grade_homework', scopeType: 'task', scopeId: taskId },
      {
        provider: this.aiService.providerName,
        status: result.available ? 'success' : 'degraded',
        latencyMs: Date.now() - started,
        preview: result.summary,
      },
    );
    return { ...result, callId };
  }
}
