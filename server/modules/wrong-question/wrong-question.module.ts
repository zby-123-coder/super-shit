import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MessageModule } from '../message/message.module';
import { WrongQuestionController } from './wrong-question.controller';
import { WrongQuestionService } from './wrong-question.service';
import { ReviewReminderService } from './review-reminder.service';

@Module({
  imports: [AccountModule, MessageModule],
  controllers: [WrongQuestionController],
  providers: [WrongQuestionService, ReviewReminderService],
  exports: [WrongQuestionService, ReviewReminderService],
})
export class WrongQuestionModule {}
