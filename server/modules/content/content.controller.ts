import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import type {
  ArticleDTO,
  ArticleListResponse,
  ArticleStatus,
  SaveArticleRequest,
} from '@shared/api.interface';
import { ContentService } from './content.service';

class SaveArticleDto implements SaveArticleRequest {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsIn(['case', 'trial', 'tour', 'news'])
  columnType!: 'case' | 'trial' | 'tour' | 'news';

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pinned?: boolean;
}

class UpdateStatusDto {
  @IsString()
  @IsIn(['published', 'offline'])
  status!: 'published' | 'offline';
}

@Controller('api/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('favorites')
  async favorites(@Req() req: Request): Promise<ArticleListResponse> {
    const { userId } = req.userContext;
    return this.contentService.listFavorites(userId);
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('columnType') columnType?: string,
    @Query('includeOffline') includeOffline?: string,
  ): Promise<ArticleListResponse> {
    const { userId } = req.userContext;
    return this.contentService.list({
      userId,
      columnType,
      includeOffline: includeOffline === 'true',
    });
  }

  @Get(':id')
  async detail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ArticleDTO> {
    const { userId } = req.userContext;
    return this.contentService.detail(id, userId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: SaveArticleDto,
  ): Promise<ArticleDTO> {
    const { userId } = req.userContext;
    return this.contentService.save(
      {
        title: dto.title,
        columnType: dto.columnType,
        coverUrl: dto.coverUrl,
        summary: dto.summary,
        content: dto.content,
        pinned: dto.pinned,
      },
      userId,
    );
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SaveArticleDto,
  ): Promise<ArticleDTO> {
    const { userId } = req.userContext;
    return this.contentService.save(
      {
        title: dto.title,
        columnType: dto.columnType,
        coverUrl: dto.coverUrl,
        summary: dto.summary,
        content: dto.content,
        pinned: dto.pinned,
      },
      userId,
      id,
    );
  }

  @Patch(':id/status')
  async setStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const { userId } = req.userContext;
    await this.contentService.setStatus(id, dto.status, userId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    await this.contentService.remove(id, userId);
    return { success: true };
  }

  @Post(':id/favorite')
  async toggleFavorite(@Req() req: Request, @Param('id') id: string) {
    const { userId } = req.userContext;
    return this.contentService.toggleFavorite(id, userId);
  }
}
