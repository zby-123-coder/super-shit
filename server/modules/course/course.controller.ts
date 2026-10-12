import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type {
  CourseDTO,
  CourseStatus,
  CourseWeekResponse,
  CreateCourseRequest,
  GrantLessonRequest,
  LessonSummaryResponse,
} from '@shared/api.interface';
import { AccountService } from '../account/account.service';
import { CourseService } from './course.service';

class CreateCourseDto implements CreateCourseRequest {
  @IsString()
  studentUserId!: string;

  @IsOptional()
  @IsString()
  teacherUserId?: string;

  @IsString()
  @MaxLength(64)
  subject!: string;

  @IsString()
  startAt!: string;

  @IsString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lessonCount?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

class UpdateCourseStatusDto {
  @IsString()
  @IsIn(['pending', 'done', 'leave'])
  status!: 'pending' | 'done' | 'leave';

  @IsOptional()
  @IsString()
  remark?: string;
}

class GrantLessonDto implements GrantLessonRequest {
  @IsString()
  studentUserId!: string;

  @IsString()
  @MaxLength(64)
  subject!: string;

  @Type(() => Number)
  @IsInt()
  amount!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('api/course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly accountService: AccountService,
  ) {}

  @Get('week')
  async listWeek(
    @Req() req: Request,
    @Query('weekStart') weekStart?: string,
  ): Promise<CourseWeekResponse> {
    const { userId } = req.userContext;
    return this.courseService.listWeek(userId, weekStart);
  }

  @Get('lessons')
  async lessonSummary(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ): Promise<LessonSummaryResponse> {
    const { userId } = req.userContext;
    const target = await this.resolveStudent(userId, studentUserId);
    return this.courseService.lessonSummary(target);
  }

  private async resolveStudent(
    userId: string,
    requested?: string,
  ): Promise<string> {
    const me = await this.accountService.getMe(userId);
    if (!me.profile) {
      throw new ForbiddenException('请先完善个人身份');
    }
    if (me.profile.role === 'student') return userId;
    if (me.profile.role === 'admin') return requested || userId;
    const allowed = [...me.children, ...me.students].map(
      (item) => item.userId,
    );
    const target = requested || '';
    if (!allowed.includes(target)) {
      throw new ForbiddenException('无权查看该学生的课时信息');
    }
    return target;
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateCourseDto,
  ): Promise<CourseDTO> {
    const { userId } = req.userContext;
    return this.courseService.create(
      {
        studentUserId: dto.studentUserId,
        teacherUserId: dto.teacherUserId,
        subject: dto.subject,
        startAt: dto.startAt,
        endAt: dto.endAt,
        location: dto.location,
        lessonCount: dto.lessonCount,
        remark: dto.remark,
      },
      userId,
    );
  }

  @Post('lessons/grant')
  async grant(@Req() req: Request, @Body() dto: GrantLessonDto) {
    const { userId } = req.userContext;
    await this.courseService.grant(
      {
        studentUserId: dto.studentUserId,
        subject: dto.subject,
        amount: dto.amount,
        remark: dto.remark,
      },
      userId,
    );
    return { success: true };
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCourseStatusDto,
  ): Promise<CourseDTO> {
    const { userId } = req.userContext;
    return this.courseService.updateStatus(id, dto.status, userId, dto.remark);
  }

  @Patch('ledger/:id/confirm')
  async confirmLedger(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.courseService.confirmLedger(id, userId);
    return { success: true };
  }

  @Post(':id/consume')
  async consume(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.courseService.consume(id, userId);
  }
}
