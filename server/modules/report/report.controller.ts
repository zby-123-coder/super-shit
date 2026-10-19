import { Controller, Get, Query, Req } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type { Diagnosis, WeeklyReport } from '@shared/api.interface';
import { ReportService } from './report.service';

class DiagnosisQuery {
  @IsOptional()
  @IsString()
  studentUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 30, 90])
  days?: number;
}

@Controller('api/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('weekly')
  async weekly(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ): Promise<WeeklyReport> {
    const { userId } = req.userContext;
    return this.reportService.weekly(userId, studentUserId);
  }

  /**
   * 学情诊断：四维评分 + 错因归类 + 处方。
   * 权限同周报（学生看自己、家长看孩子、老师看学生、管理员全量）。
   */
  @Get('diagnosis')
  async diagnosis(
    @Req() req: Request,
    @Query() query: DiagnosisQuery,
  ): Promise<Diagnosis> {
    const { userId } = req.userContext;
    return this.reportService.diagnosis(
      userId,
      query.studentUserId,
      query.days ?? 30,
    );
  }
}
