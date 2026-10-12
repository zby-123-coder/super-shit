import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [AccountModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
