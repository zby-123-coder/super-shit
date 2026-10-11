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
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type { BroadcastRequest, MessageListResponse } from '@shared/api.interface';
import { MessageService } from './message.service';

class BroadcastDto implements BroadcastRequest {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @IsIn(['student', 'parent', 'teacher', 'admin'])
  role?: 'student' | 'parent' | 'teacher' | 'admin';
}

@Controller('api/message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async list(@Req() req: Request): Promise<MessageListResponse> {
    const { userId } = req.userContext;
    return this.messageService.list(userId);
  }

  @NeedLogin()
  @Patch(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.messageService.markRead(id, userId);
    return { success: true };
  }

  @NeedLogin()
  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    const { userId } = req.userContext;
    await this.messageService.markAllRead(userId);
    return { success: true };
  }

  @NeedLogin()
  @Post('broadcast')
  async broadcast(@Body() dto: BroadcastDto) {
    const count = await this.messageService.broadcast({
      title: dto.title,
      content: dto.content,
      role: dto.role,
    });
    return { success: true, count };
  }
}
