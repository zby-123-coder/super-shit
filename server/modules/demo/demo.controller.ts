import { Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DemoService } from './demo.service';

@Controller('api/demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('status')
  async status(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.demoService.hasDemo(userId);
  }

  @Post('seed')
  async seed(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.demoService.seed(userId);
  }

  @Post('clear')
  async clear(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.demoService.clear(userId);
  }
}
