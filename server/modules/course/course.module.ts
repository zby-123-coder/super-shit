import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MessageModule } from '../message/message.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [AccountModule, MessageModule],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
