import { Body, Controller, ForbiddenException, Get, Post, Req } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { OpsService } from './ops.service';

class GenerateDto {
  @IsString()
  @MaxLength(64)
  grade!: string;

  @IsString()
  @MaxLength(64)
  region!: string;

  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  material?: string;

  @IsOptional()
  @IsBoolean()
  saveDraft?: boolean;
}

@Controller('api/ops')
export class OpsController {
  constructor(private readonly service: OpsService) {}

  /** 今日选题提示（运营日历，基于学期节点） */
  @Get('daily-tips')
  dailyTips() {
    return this.service.dailyTips();
  }

  /** 运营草稿列表 */
  @Get('drafts')
  drafts() {
    return this.service.drafts();
  }

  /**
   * 生成运营文案：选题 + 素材 → 摘要 + 三平台文案，可存草稿。
   * 仅老师/管理员（运营职能）。
   */
  @Post('generate')
  generate(@Req() req: Request, @Body() dto: GenerateDto) {
    const { userId, role } = req.userContext;
    if (role !== 'teacher' && role !== 'admin') {
      throw new ForbiddenException('只有老师或管理员可以使用运营工作台');
    }
    return this.service.generate(userId, dto);
  }
}
