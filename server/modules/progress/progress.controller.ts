import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type { ProgressDTO, SaveProgressRequest } from '@shared/api.interface';
import { AccountService } from '../account/account.service';
import { ProgressService } from './progress.service';

class SaveProgressDto implements SaveProgressRequest {
  @IsString()
  studentUserId!: string;

  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsString()
  @MaxLength(255)
  chapter!: string;

  @Type(() => Number)
  @IsInt()
  percent!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  currentPoint?: string;
}

@Controller('api/progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly accountService: AccountService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ): Promise<ProgressDTO[]> {
    const { userId } = req.userContext;
    const me = await this.accountService.getMe(userId);
    if (!me.profile) return [];
    if (me.profile.role === 'student') {
      return this.progressService.list(userId);
    }
    if (me.profile.role === 'admin') {
      return this.progressService.list(studentUserId || userId);
    }
    const allowed = [...me.children, ...me.students].map((item) => item.userId);
    const target = studentUserId || '';
    if (!allowed.includes(target)) {
      throw new ForbiddenException('无权查看该学生的学习进度');
    }
    return this.progressService.list(target);
  }

  @Post()
  async save(
    @Req() req: Request,
    @Body() dto: SaveProgressDto,
  ): Promise<ProgressDTO> {
    const { userId } = req.userContext;
    return this.progressService.save(
      {
        studentUserId: dto.studentUserId,
        subject: dto.subject,
        chapter: dto.chapter,
        percent: dto.percent,
        currentPoint: dto.currentPoint,
      },
      userId,
    );
  }
}
