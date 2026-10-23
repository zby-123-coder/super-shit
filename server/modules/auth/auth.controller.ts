import {
  Body,
  Controller,
  Headers,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@shared/api.interface';
import { AuthService } from './auth.service';

class RegisterDto implements RegisterRequest {
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  loginName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password!: string;

  @IsString()
  @IsIn(['student', 'parent', 'teacher', 'admin'])
  role!: 'student' | 'parent' | 'teacher' | 'admin';

  @IsString()
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subjectTags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  familyInviteCode?: string;
}

class LoginDto implements LoginRequest {
  @IsString()
  loginName!: string;

  @IsString()
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  oldPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword!: string;
}

class ResetPasswordDto {
  /** 不填则服务端生成随机临时密码 */
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register({
      loginName: dto.loginName,
      password: dto.password,
      role: dto.role,
      name: dto.name,
      phone: dto.phone,
      grade: dto.grade,
      subjectTags: dto.subjectTags,
      familyInviteCode: dto.familyInviteCode,
    });
  }

  @Post('login')
  async login(@Req() req: Request, @Body() dto: LoginDto): Promise<AuthResponse> {
    const ip = req.ip ?? '';
    return this.authService.login(
      {
        loginName: dto.loginName,
        password: dto.password,
      },
      ip,
    );
  }

  @Post('logout')
  async logout(
    @Headers('authorization') header?: string,
  ): Promise<{ success: boolean }> {
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    await this.authService.revoke(token);
    return { success: true };
  }

  /**
   * 修改自己的密码（登录用户）。改密后吊销全部会话，需重新登录。
   */
  @Patch('password')
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const { userId } = req.userContext;
    return this.authService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }

  /**
   * 管理员重置成员密码（无需旧密码）。返回临时密码，由管理员转告成员。
   */
  @Post('reset-password/:userId')
  async resetPassword(
    @Req() req: Request,
    @Param('userId') targetUserId: string,
    @Body() dto?: ResetPasswordDto,
  ) {
    const { userId } = req.userContext;
    return this.authService.resetPassword(userId, targetUserId, dto?.newPassword);
  }
}
