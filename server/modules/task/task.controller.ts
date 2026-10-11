import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type {
  CheckinDTO,
  CreateCheckinRequest,
  CreateTaskRequest,
  ReviewCheckinRequest,
  TaskDTO,
  TaskListResponse,
} from '@shared/api.interface';
import { TaskService } from './task.service';

class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  studentUserId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  subject?: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;
}

class CreateCheckinDto implements CreateCheckinRequest {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMin?: number;
}

class ReviewCheckinDto implements ReviewCheckinRequest {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  comment?: string;
}

@Controller('api/task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  async list(@Req() req: Request): Promise<TaskListResponse> {
    const { userId } = req.userContext;
    return this.taskService.list(userId);
  }

  @Get('pending')
  async pending(@Req() req: Request): Promise<TaskDTO[]> {
    const { userId } = req.userContext;
    return this.taskService.pendingReviews(userId);
  }

  @NeedLogin()
  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskDTO> {
    const { userId } = req.userContext;
    return this.taskService.create(
      {
        studentUserId: dto.studentUserId,
        subject: dto.subject,
        title: dto.title,
        content: dto.content,
        dueAt: dto.dueAt,
      },
      userId,
    );
  }

  @NeedLogin()
  @Post(':id/checkin')
  async checkin(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateCheckinDto,
  ): Promise<CheckinDTO> {
    const { userId } = req.userContext;
    return this.taskService.checkin(
      id,
      {
        content: dto.content,
        imageUrls: dto.imageUrls,
        durationMin: dto.durationMin,
      },
      userId,
    );
  }

  @NeedLogin()
  @Patch('checkin/:id/review')
  async review(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReviewCheckinDto,
  ) {
    const { userId } = req.userContext;
    await this.taskService.review(
      id,
      { status: dto.status, comment: dto.comment },
      userId,
    );
    return { success: true };
  }
}
