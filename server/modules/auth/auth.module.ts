import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { WechatAuthController } from './wechat.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController, WechatAuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
