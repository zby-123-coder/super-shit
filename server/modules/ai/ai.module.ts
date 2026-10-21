import { Module } from '@nestjs/common';
import { AiService } from '@server/common/ai/ai.service';
import { StorageService } from '@server/common/storage/storage.service';
import { AccountModule } from '../account/account.module';
import { AiController } from './ai.controller';
import { AiInvocationService } from './ai-invocation.service';

@Module({
  imports: [AccountModule],
  controllers: [AiController],
  providers: [AiService, StorageService, AiInvocationService],
  exports: [AiService, AiInvocationService],
})
export class AiModule {}