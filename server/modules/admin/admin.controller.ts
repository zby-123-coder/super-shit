import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type {
  AdminOverview,
  AdminUserDTO,
  AdminUserListResponse,
  AssignRelationRequest,
  UpdateAdminUserRequest,
} from '@shared/api.interface';
import { AdminService } from './admin.service';

class UpdateUserDto implements UpdateAdminUserRequest {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['student', 'parent', 'teacher', 'admin'])
  role?: 'student' | 'parent' | 'teacher' | 'admin';

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
}

class AssignDto implements AssignRelationRequest {
  @IsString()
  studentUserId!: string;

  @IsOptional()
  @IsString()
  teacherUserId?: string;

  @IsOptional()
  @IsString()
  parentUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  subject?: string;
}

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async overview(@Req() req: Request): Promise<AdminOverview> {
    const { userId } = req.userContext;
    return this.adminService.overview(userId);
  }

  @Get('users')
  async users(@Req() req: Request): Promise<AdminUserListResponse> {
    const { userId } = req.userContext;
    return this.adminService.listUsers(userId);
  }

  @NeedLogin()
  @Patch('users/:id')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<AdminUserDTO> {
    const { userId } = req.userContext;
    return this.adminService.updateUser(userId, id, {
      name: dto.name,
      role: dto.role,
      phone: dto.phone,
      grade: dto.grade,
      subjectTags: dto.subjectTags,
    });
  }

  @NeedLogin()
  @Post('assign')
  async assign(@Req() req: Request, @Body() dto: AssignDto) {
    const { userId } = req.userContext;
    return this.adminService.assign(userId, {
      studentUserId: dto.studentUserId,
      teacherUserId: dto.teacherUserId,
      parentUserId: dto.parentUserId,
      subject: dto.subject,
    });
  }
}
