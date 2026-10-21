import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AiModule } from '../ai/ai.module';
import { CompanionController } from './companion.controller';
import { CompanionService } from './companion.service';

@Module({
  imports: [AccountModule, AiModule],
  controllers: [CompanionController],
  providers: [CompanionService],
})
export class CompanionModule {}
