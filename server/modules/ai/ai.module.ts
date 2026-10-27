import { Module } from '@nestjs/common';
import { AiService } from '@server/common/ai/ai.service';
import { LangfuseExporter } from '@server/common/ai/langfuse-exporter';
import { StorageService } from '@server/common/storage/storage.service';
import { AccountModule } from '../account/account.module';
import { AiController } from './ai.controller';
import { AiInvocationService } from './ai-invocation.service';
import { AiIdempotencyService } from './ai-idempotency.service';
import { AiTraceService } from './ai-trace.service';

@Module({
  imports: [AccountModule],
  controllers: [AiController],
  providers: [AiService, StorageService, AiInvocationService, AiIdempotencyService, AiTraceService, LangfuseExporter],
  exports: [AiService, AiInvocationService, AiIdempotencyService, AiTraceService, LangfuseExporter],
})
export class AiModule {}