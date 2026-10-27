import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AiModule } from '../ai/ai.module';
import { KbModule } from '../kb/kb.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [AccountModule, AiModule, KbModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
