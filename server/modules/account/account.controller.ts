import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type {
  AccountMeResponse,
  AppProfileDTO,
  BindByCodeRequest,
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
}

class BindByCodeDto implements BindByCodeRequest {
  @IsString()
  @MaxLength(16)
  inviteCode!: string;
}

@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  async getMe(@Req() req: Request): Promise<AccountMeResponse> {
    const { userId } = req.userContext;
    return this.accountService.getMe(userId);
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
    });
  }

  @Post('bind')
  async bind(@Req() req: Request, @Body() dto: BindByCodeDto) {
    const { userId } = req.userContext;
    return this.accountService.bindByCode(userId, dto.inviteCode);
  }

  @Get('bindings')
  async listBindings(@Req() req: Request) {
    const { userId } = req.userContext;
    return this.accountService.listBindings(userId);
  }

  @Delete('bind/:id')
  async unbind(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.accountService.unbind(id, userId);
    return { success: true };
  }
}
