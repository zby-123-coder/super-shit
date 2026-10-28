import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AiModule } from '../ai/ai.module';
import { CompanionController } from './companion.controller';
import { CompanionMemoryService } from './companion-memory.service';
import { CompanionService } from './companion.service';

@Module({
  imports: [AccountModule, AiModule],
  controllers: [CompanionController],
  providers: [CompanionService, CompanionMemoryService],
  exports: [CompanionMemoryService],
})
export class CompanionModule {}
