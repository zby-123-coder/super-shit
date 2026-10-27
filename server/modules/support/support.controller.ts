import { Body, Controller, Post, Req } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';
import type { Request } from 'express';
import { SupportService } from './support.service';

class SupportAskDto {
  @IsString()
  @MaxLength(500)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  studentUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  region?: string;
}

class SupportFeedbackDto {
  @IsUUID()
  callId!: string;

  @IsIn(['up', 'down'])
  rating!: 'up' | 'down';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

@Controller('api/support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  /**
   * 智能客服提问：RAG 检索（2-gram）→ 受约束生成 → { answer, sources, callId }。
   * 库外必须拒答转人工；回答必须带来源；同问题 10s 内幂等复用。
   */
  @Post('ask')
  ask(@Req() req: Request, @Body() dto: SupportAskDto) {
    const ctx = req.userContext!;
    return this.service.ask(ctx.userId, {
      question: dto.question,
      studentUserId: dto.studentUserId,
      region: dto.region,
    });
  }

  /** 用户反馈（👍👎）：记为 trace 上的 event，Langfuse 映射为 score。 */
  @Post('feedback')
  feedback(@Req() req: Request, @Body() dto: SupportFeedbackDto) {
    const ctx = req.userContext!;
    return this.service.feedback(ctx.userId, {
      callId: dto.callId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }
}
