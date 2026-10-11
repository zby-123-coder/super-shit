import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [AccountModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
