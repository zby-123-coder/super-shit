import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Request } from 'express';
import type { RecommendQuestionsRequest } from '@shared/api.interface';
import { QuestionBankService } from './question-bank.service';

class CreateDto {
  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chapter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  knowledgePoint?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

class RecommendDto implements RecommendQuestionsRequest {
  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsString()
  @MaxLength(255)
  knowledgePoint!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chapter?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;
}

@Controller('api/question-bank')
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}

  /** 题库列表（可按学科/知识点筛选） */
  @Get()
  list(
    @Query('subject') subject?: string,
    @Query('knowledgePoint') knowledgePoint?: string,
  ) {
    return this.service.list({ subject, knowledgePoint });
  }

  /** 录题（仅老师/管理员） */
  @Post()
  create(@Body() dto: CreateDto, @Req() req: Request) {
    const { role } = req.userContext;
    if (role !== 'teacher' && role !== 'admin') {
      throw new ForbiddenException('只有老师或管理员可以录入题目');
    }
    return this.service.create(dto);
  }

  /**
   * 举一反三：先查题库，不足则 AI 生成变式并入库。
   * 家长/学生/老师均可调用（推荐题为通用练习，无越权风险）。
   */
  @Post('recommend')
  recommend(@Body() dto: RecommendDto, @Req() req: Request) {
    return this.service.recommend({
      subject: dto.subject,
      knowledgePoint: dto.knowledgePoint,
      chapter: dto.chapter,
      count: dto.count ?? 3,
    });
  }
}
