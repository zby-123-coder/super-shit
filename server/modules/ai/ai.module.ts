import { Module } from '@nestjs/common';
import { AiService } from '@server/common/ai/ai.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
