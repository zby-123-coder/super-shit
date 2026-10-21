import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdmissionService } from './admission.service';

class MatchDto {
  @IsArray()
  @IsString({ each: true })
  subjects!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string;
}

@Controller('api/admission')
export class AdmissionController {
  constructor(private readonly service: AdmissionService) {}

  /** 学校库（城市/关键词筛选） */
  @Get('schools')
  schools(
    @Query('city') city?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.schools({ city, keyword });
  }

  /** 专业库（含选科要求与就业方向） */
  @Get('majors')
  majors(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
  ) {
    return this.service.majors({ keyword, category });
  }

  /** 选科匹配：给选科组合 → 可报专业列表（满足在前） */
  @Post('match')
  match(@Body() dto: MatchDto) {
    return this.service.match({
      subjects: dto.subjects,
      city: dto.city,
      keyword: dto.keyword,
    });
  }
}
