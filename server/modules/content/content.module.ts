import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MessageModule } from '../message/message.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [AccountModule, MessageModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
