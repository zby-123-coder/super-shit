import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { KbService } from './kb.service';

class KbSearchDto {
  @IsOptional()
  @IsIn(['gaokao', 'zhongkao'])
  stage?: string;

  @IsOptional()
  @IsIn(['policy', 'zhiyuan', 'xuanke', 'timeline', 'special', 'faq'])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class KbUpsertDto {
  @IsIn(['gaokao', 'zhongkao'])
  stage!: string;

  @IsIn(['policy', 'zhiyuan', 'xuanke', 'timeline', 'special', 'faq'])
  category!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  region?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;
}

@Controller('api/kb')
export class KbController {
  constructor(private readonly service: KbService) {}

  /**
   * 知识库检索：stage/category/region 过滤 + keyword 检索。
   * 智能客服接入口：检索 top N → 拼 prompt → LLM 生成回答（RAG 口子预留）。
   */
  @Get('search')
  search(
    @Query('stage') stage?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.search({
      stage,
      category,
      region,
      keyword,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /** 分类统计 */
  @Get('stats')
  stats() {
    return this.service.stats();
  }

  /** 人工补库（upsert，唯一键 stage+title） */
  @Post('entries')
  upsert(@Body() dto: KbUpsertDto) {
    return this.service.upsert({
      stage: dto.stage,
      category: dto.category,
      region: dto.region,
      title: dto.title,
      question: dto.question,
      content: dto.content,
      keywords: dto.keywords,
      source: dto.source,
    });
  }
}
