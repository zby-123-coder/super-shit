import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import type { AuthResponse } from '@shared/api.interface';
import { AuthService } from './auth.service';

class WechatLoginDto {
  @IsString()
  @MaxLength(256)
  code!: string;
}

/**
 * 微信一键登录（预留）。
 *
 * 启用方式（.env.local 或部署环境变量）：
 *   WECHAT_APPID=wxXXXXXXXXXXXX
 *   WECHAT_SECRET=你的小程序 AppSecret
 *
 * 未配置时接口返回 503 与明确提示，小程序端继续用账号密码登录；
 * 配置后小程序 wx.login() 拿 code 调本接口即可直接登录，无需密码。
 * 已有账号绑定微信的能力留待后续（在「我的」里调同一接口 + 当前 token）。
 */
@Controller('api/auth/wechat')
export class WechatAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() dto: WechatLoginDto): Promise<AuthResponse> {
    return this.authService.loginByWechat(dto.code);
  }
}
