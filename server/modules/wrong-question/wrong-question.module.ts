import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { WrongQuestionController } from './wrong-question.controller';
import { WrongQuestionService } from './wrong-question.service';

@Module({
  imports: [AccountModule],
  controllers: [WrongQuestionController],
  providers: [WrongQuestionService],
  exports: [WrongQuestionService],
})
export class WrongQuestionModule {}
