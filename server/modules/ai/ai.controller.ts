import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { AiService } from '@server/common/ai/ai.service';

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
  constructor(private readonly aiService: AiService) {}

  /** 当前生效的 AI 提供方（前端可据此提示"AI 已接入/使用规则版"） */
  @Get('status')
  status() {
    return { provider: this.aiService.providerName };
  }

  @Post('review-draft')
  async reviewDraft(@Body() dto: ReviewDraftDto) {
    const draft = await this.aiService.reviewDraft({
      content: dto.content,
      durationMin: dto.durationMin ?? 0,
      taskTitle: dto.taskTitle,
    });
    return { draft };
  }

  @Post('variant')
  async variant(@Body() dto: VariantDto) {
    const variant = await this.aiService.variant({
      subject: dto.subject,
      title: dto.title,
      knowledgePoint: dto.knowledgePoint,
    });
    return { variant };
  }
}
