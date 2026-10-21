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
}
