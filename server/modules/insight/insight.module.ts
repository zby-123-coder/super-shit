import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AiModule } from '../ai/ai.module';
import { MessageModule } from '../message/message.module';
import { InsightController } from './insight.controller';
import { InsightService } from './insight.service';

@Module({
  imports: [AccountModule, AiModule, MessageModule],
  controllers: [InsightController],
  providers: [InsightService],
})
export class InsightModule {}
