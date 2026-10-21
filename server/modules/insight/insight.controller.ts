import { Controller, ForbiddenException, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { InsightService } from './insight.service';

@Controller('api/insight')
export class InsightController {
  constructor(private readonly service: InsightService) {}

  /** 某学生最新状态（学生本人/家长/老师/管理员） */
  @Get(':studentUserId')
  async latest(
    @Req() req: Request,
    @Param('studentUserId') studentUserId: string,
  ) {
    const { userId } = req.userContext;
    const row = await this.service.latest(userId, studentUserId);
    if (!row) {
      return { level: 'unknown', headline: '暂无评估记录', evidence: [], actions: [] };
    }
    return {
      id: row.id,
      studentUserId: row.studentUserId,
      level: row.level,
      score: row.score,
      headline: row.headline,
      signals: row.signals,
      evidence: row.evidence,
      actions: row.actions,
      executed: row.executed,
      createdAt: row.createdAt,
    };
  }

  /** 风险学生列表（老师/管理员） */
  @Get()
  async riskList(@Req() req: Request) {
    const { userId, role } = req.userContext;
    if (role !== 'teacher' && role !== 'admin') {
      throw new ForbiddenException('只有老师或管理员可以查看风险学生列表');
    }
    const rows = await this.service.riskList(userId);
    return rows.map((row) => ({
      id: row.id,
      studentUserId: row.studentUserId,
      level: row.level,
      score: row.score,
      headline: row.headline,
      evidence: row.evidence,
      actions: row.actions,
      executed: row.executed,
      createdAt: row.createdAt,
    }));
  }

  /** 手动扫描（管理员） */
  @Post('scan')
  async scan(@Req() req: Request) {
    const { role } = req.userContext;
    if (role !== 'admin') {
      throw new ForbiddenException('只有管理员可以手动扫描');
    }
    return this.service.scanNow();
  }

  /** 立即评估某个学生并执行动作（管理员/老师，联调用） */
  @Post('evaluate/:studentUserId')
  async evaluate(@Req() req: Request, @Param('studentUserId') studentUserId: string) {
    const { userId, role } = req.userContext;
    if (role !== 'teacher' && role !== 'admin') {
      throw new ForbiddenException('只有老师或管理员可以触发评估');
    }
    const row = await this.service.evaluate(studentUserId);
    const executed = await this.service.executeActions(row);
    return {
      level: row.level,
      score: row.score,
      headline: row.headline,
      evidence: row.evidence,
      actions: row.actions,
      executed,
    };
  }
}
