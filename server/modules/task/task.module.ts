import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MessageModule } from '../message/message.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [AccountModule, MessageModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
