import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';

@Module({
  imports: [AiModule],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
