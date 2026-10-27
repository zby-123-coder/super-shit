import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { AccountModule } from './modules/account/account.module';
import { MessageModule } from './modules/message/message.module';
import { CourseModule } from './modules/course/course.module';
import { TaskModule } from './modules/task/task.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ContentModule } from './modules/content/content.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { OpsModule } from './modules/ops/ops.module';
import { CompanionModule } from './modules/companion/companion.module';
import { InsightModule } from './modules/insight/insight.module';
import { AdmissionModule } from './modules/admission/admission.module';
import { KbModule } from './modules/kb/kb.module';
import { SupportModule } from './modules/support/support.module';
import { UploadModule } from './modules/upload/upload.module';
import { DemoModule } from './modules/demo/demo.module';
import { ReportModule } from './modules/report/report.module';
import { WrongQuestionModule } from './modules/wrong-question/wrong-question.module';

@Module({
  imports: [
    // 全局数据库模块（自持接入，替代平台能力）
    DatabaseModule,
    // 定时任务（复习提醒等）
    ScheduleModule.forRoot(),
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    AuthModule,
    AccountModule,
    MessageModule,
    CourseModule,
    TaskModule,
    ProgressModule,
    ContentModule,
    AdminModule,
    AiModule,
    QuestionBankModule,
    OpsModule,
    CompanionModule,
    InsightModule,
    AdmissionModule,
    KbModule,
    SupportModule,
    UploadModule,
    DemoModule,
    ReportModule,
    WrongQuestionModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
