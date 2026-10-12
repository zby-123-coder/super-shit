import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type {
  AccountMeResponse,
  AppProfileDTO,
  CreateChildRequest,
  FamilyDTO,
  SaveProfileRequest,
} from '@shared/api.interface';
import { AccountService } from './account.service';

class SaveProfileDto implements SaveProfileRequest {
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
  avatarUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  notifyMute?: boolean;
}

class TeachDto {
  @IsString()
  @MaxLength(16)
  inviteCode!: string;
}

class CreateChildDto implements CreateChildRequest {
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  loginName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password!: string;

  @IsString()
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  grade?: string;
}

@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  async getMe(@Req() req: Request): Promise<AccountMeResponse> {
    const { userId } = req.userContext;
    return this.accountService.getMe(userId);
  }

  @Get('family')
  async getFamily(@Req() req: Request): Promise<FamilyDTO | null> {
    const { userId } = req.userContext;
    return this.accountService.getFamily(userId);
  }

  @Post('profile')
  async saveProfile(
    @Req() req: Request,
    @Body() dto: SaveProfileDto,
  ): Promise<AppProfileDTO> {
    const { userId } = req.userContext;
    return this.accountService.saveProfile(userId, {
      role: dto.role,
      name: dto.name,
      phone: dto.phone,
      grade: dto.grade,
      subjectTags: dto.subjectTags,
      avatarUrl: dto.avatarUrl,
      notifyMute: dto.notifyMute,
    });
  }

  /** 老师凭学生邀请码添加学生 */
  @Post('teach')
  async addStudent(@Req() req: Request, @Body() dto: TeachDto) {
    const { userId } = req.userContext;
    const student = await this.accountService.addStudentByCode(
      userId,
      dto.inviteCode,
    );
    return { success: true, studentName: student.name };
  }

  /** 户主在家庭内创建孩子账号 */
  @Post('child')
  async createChild(
    @Req() req: Request,
    @Body() dto: CreateChildDto,
  ): Promise<AppProfileDTO> {
    const { userId } = req.userContext;
    return this.accountService.createChild(userId, {
      loginName: dto.loginName,
      password: dto.password,
      name: dto.name,
      grade: dto.grade,
    });
  }
}
