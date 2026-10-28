import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { CompanionService } from './companion.service';

class StartDto {
  @IsOptional()
  @IsString()
  studentUserId?: string;

  @IsOptional()
  @IsString()
  wrongQuestionId?: string;
}

class SendDto {
  @IsString()
  @MaxLength(1000)
  content!: string;
}

@Controller('api/companion')
export class CompanionController {
  constructor(private readonly service: CompanionService) {}

  /** 开始一次引导会话（可绑定一道错题） */
  @Post('start')
  async start(@Req() req: Request, @Body() dto: StartDto) {
    const { userId } = req.userContext;
    return this.service.start(userId, dto);
  }

  /** 继续对话（多轮，历史入库） */
  @Post('sessions/:id/messages')
  async send(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendDto,
  ) {
    const { userId } = req.userContext;
    return this.service.send(userId, id, dto.content);
  }

  /** 会话列表 */
  @Get('sessions')
  async sessions(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
  ) {
    const { userId } = req.userContext;
    return this.service.listSessions(userId, studentUserId);
  }

  /** 会话消息记录 */
  @Get('sessions/:id')
  async messages(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.service.listMessages(userId, id);
  }

  /** 小引对该学生的记忆卡（跨会话累积，权限同会话隔离；默认只给生效记忆） */
  @Get('memory')
  async memory(
    @Req() req: Request,
    @Query('studentUserId') studentUserId?: string,
    @Query('includeSuperseded') includeSuperseded?: string,
  ) {
    const { userId } = req.userContext;
    return this.service.memory(userId, studentUserId, includeSuperseded === 'true');
  }

  /** 记忆 RAG 取回（词面相关 × 重要度 × 时间衰减；调试/评测用） */
  @Get('memory/retrieve')
  async retrieveMemory(
    @Req() req: Request,
    @Query('q') q: string,
    @Query('studentUserId') studentUserId?: string,
  ) {
    const { userId } = req.userContext;
    return this.service.retrieveMemories(userId, q ?? '', studentUserId);
  }

  /** 手动触发影子总结（运维/测试；正常流程由 30min 沉默/轮次懒触发） */
  @Post('sessions/:id/summarize')
  async summarize(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.service.summarizeManually(userId, id);
  }
}
