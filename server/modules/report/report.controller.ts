import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { WeeklyReport } from '@shared/api.interface';
import { ReportService } from './report.service';

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
}
