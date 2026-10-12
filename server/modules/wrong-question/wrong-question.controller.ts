import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type { SaveWrongQuestionRequest, WrongQuestionDTO } from '@shared/api.interface';
import { WrongQuestionService } from './wrong-question.service';

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
  constructor(private readonly service: WrongQuestionService) {}

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
