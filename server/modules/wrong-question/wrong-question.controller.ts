import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type { SaveWrongQuestionRequest, WrongQuestionDTO } from '@shared/api.interface';
import { WrongQuestionService } from './wrong-question.service';
import { ReviewReminderService } from './review-reminder.service';

class SaveDto implements SaveWrongQuestionRequest {
  @IsOptional()
  @IsString()
  studentUserId?: string;

  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chapter?: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  knowledgePoint?: string;
}

class StatusDto {
  @IsString()
  @IsIn(['open', 'corrected'])
  status!: 'open' | 'corrected';
}

@Controller('api/wrong-question')
export class WrongQuestionController {
  constructor(
    private readonly service: WrongQuestionService,
    private readonly reviewReminder: ReviewReminderService,
  ) {}

  /** 手动触发复习提醒（仅管理员；日常由定时任务自动执行） */
  @Post('review-reminder/run')
  async runReminder(@Req() req: Request) {
    const { role } = req.userContext;
    if (role !== 'admin') {
      throw new ForbiddenException('只有管理员可以手动触发复习提醒');
    }
    return this.reviewReminder.runNow();
  }

  /** 复习计划：已排期未掌握的错题 */
  @Get('review-plan')
  async reviewPlan(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ) {
    const { userId } = req.userContext;
    return this.service.reviewPlan(userId, studentUserId);
  }

  /** 完成一轮复习（阶段推进，到顶标记 mastered） */
  @Post(':id/review-done')
  async reviewDone(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.service.reviewDone(id, userId);
    return { success: true };
  }

  /** 跳过本轮复习（顺延，不推进阶段） */
  @Post(':id/review-skip')
  async reviewSkip(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.service.reviewSkip(id, userId);
    return { success: true };
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ): Promise<WrongQuestionDTO[]> {
    const { userId } = req.userContext;
    return this.service.list(userId, studentUserId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: SaveDto,
  ): Promise<WrongQuestionDTO> {
    const { userId } = req.userContext;
    return this.service.create(userId, {
      studentUserId: dto.studentUserId,
      subject: dto.subject,
      chapter: dto.chapter,
      title: dto.title,
      reason: dto.reason,
      knowledgePoint: dto.knowledgePoint,
    });
  }

  @Patch(':id/corrected')
  async markCorrected(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.service.markCorrected(id, userId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.service.remove(id, userId);
    return { success: true };
  }
}
