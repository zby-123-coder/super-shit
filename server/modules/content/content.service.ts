import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { article, articleFavorite } from '@server/database/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type {
  ArticleColumn,
  ArticleDTO,
  ArticleListResponse,
  ArticleStatus,
  SaveArticleRequest,
} from '@shared/api.interface';
import { AccountService } from '../account/account.service';
import { MessageService } from '../message/message.service';

type ArticleRow = typeof article.$inferSelect;

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
    private readonly messageService: MessageService,
  ) {}

  private async favoriteSet(userId: string): Promise<Set<string>> {
    const rows = await this.db
      .select({ articleId: articleFavorite.articleId })
      .from(articleFavorite)
      .where(eq(articleFavorite.userId, userId));
    return new Set<string>(rows.map((row) => row.articleId));
  }

  private async toDTO(
    row: ArticleRow,
    favorites: Set<string>,
    nameMap: Map<string, string>,
  ): Promise<ArticleDTO> {
    return {
      id: row.id,
      title: row.title,
      columnType: row.columnType as ArticleColumn,
      coverUrl: row.coverUrl ?? '',
      summary: row.summary ?? '',
      content: row.content,
      status: row.status as ArticleStatus,
      pinned: row.pinned,
      readCount: row.readCount,
      authorName: nameMap.get(row.authorUserId ?? '') ?? '平台运营',
      favorited: favorites.has(row.id),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async nameMapOf(rows: ArticleRow[]): Promise<Map<string, string>> {
    const ids = rows
      .map((row: ArticleRow) => row.authorUserId ?? '')
      .filter((id: string) => !!id);
    if (ids.length === 0) return new Map<string, string>();
    const profileMap = await this.accountService.getProfileMap(ids);
    const map = new Map<string, string>();
    profileMap.forEach((value, key) => {
      map.set(key, value.name);
    });
    return map;
  }

  async list(params: {
    userId: string;
    columnType?: string;
    includeOffline?: boolean;
  }): Promise<ArticleListResponse> {
    const conditions = [];
    if (!params.includeOffline) {
      conditions.push(eq(article.status, 'published'));
    }
    if (params.columnType) {
      conditions.push(eq(article.columnType, params.columnType));
    }
    const rows: ArticleRow[] =
      conditions.length > 0
        ? await this.db
            .select()
            .from(article)
            .where(and(...conditions))
            .orderBy(desc(article.pinned), desc(article.createdAt))
            .limit(60)
        : await this.db
            .select()
            .from(article)
            .orderBy(desc(article.pinned), desc(article.createdAt))
            .limit(60);
    const favorites = await this.favoriteSet(params.userId);
    const nameMap = await this.nameMapOf(rows);
    const items: ArticleDTO[] = [];
    for (const row of rows) {
      items.push(await this.toDTO(row, favorites, nameMap));
    }
    return { items };
  }

  async detail(id: string, userId: string): Promise<ArticleDTO> {
    const rows: ArticleRow[] = await this.db
      .select()
      .from(article)
      .where(eq(article.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException('内容不存在');
    }
    await this.db
      .update(article)
      .set({ readCount: rows[0].readCount + 1 })
      .where(eq(article.id, id));
    const favorites = await this.favoriteSet(userId);
    const nameMap = await this.nameMapOf(rows);
    return this.toDTO(rows[0], favorites, nameMap);
  }

  async save(
    dto: SaveArticleRequest,
    userId: string,
    id?: string,
  ): Promise<ArticleDTO> {
    const me = await this.accountService.findProfile(userId);
    if (!me || me.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以发布内容');
    }
    let rows: ArticleRow[] = [];
    if (id) {
      rows = await this.db
        .update(article)
        .set({
          title: dto.title,
          columnType: dto.columnType,
          coverUrl: dto.coverUrl ?? null,
          summary: dto.summary ?? null,
          content: dto.content,
          pinned: dto.pinned ?? false,
        })
        .where(eq(article.id, id))
        .returning();
    } else {
      rows = await this.db
        .insert(article)
        .values({
          title: dto.title,
          columnType: dto.columnType,
          coverUrl: dto.coverUrl ?? null,
          summary: dto.summary ?? null,
          content: dto.content,
          pinned: dto.pinned ?? false,
          authorUserId: userId,
          status: 'published',
        })
        .returning();
      await this.messageService.broadcast({
        title: `新内容发布：${dto.title}`,
        content: dto.summary || dto.title,
      });
    }
    const favorites = await this.favoriteSet(userId);
    const nameMap = await this.nameMapOf(rows);
    return this.toDTO(rows[0], favorites, nameMap);
  }

  async setStatus(
    id: string,
    status: ArticleStatus,
    userId: string,
  ): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me || me.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以管理内容');
    }
    await this.db.update(article).set({ status }).where(eq(article.id, id));
  }

  async remove(id: string, userId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me || me.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除内容');
    }
    await this.db
      .delete(articleFavorite)
      .where(eq(articleFavorite.articleId, id));
    await this.db.delete(article).where(eq(article.id, id));
  }

  async toggleFavorite(
    id: string,
    userId: string,
  ): Promise<{ favorited: boolean }> {
    const rows = await this.db
      .select()
      .from(articleFavorite)
      .where(
        and(
          eq(articleFavorite.userId, userId),
          eq(articleFavorite.articleId, id),
        ),
      )
      .limit(1);
    if (rows.length > 0) {
      await this.db
        .delete(articleFavorite)
        .where(eq(articleFavorite.id, rows[0].id));
      return { favorited: false };
    }
    await this.db.insert(articleFavorite).values({
      userId,
      articleId: id,
    });
    return { favorited: true };
  }

  async listFavorites(userId: string): Promise<ArticleListResponse> {
    const favs = await this.db
      .select({ articleId: articleFavorite.articleId })
      .from(articleFavorite)
      .where(eq(articleFavorite.userId, userId));
    const ids = favs.map((row) => row.articleId);
    if (ids.length === 0) return { items: [] };
    const rows: ArticleRow[] = await this.db
      .select()
      .from(article)
      .where(inArray(article.id, ids));
    const favorites = new Set<string>(ids);
    const nameMap = await this.nameMapOf(rows);
    const items: ArticleDTO[] = [];
    for (const row of rows) {
      items.push(await this.toDTO(row, favorites, nameMap));
    }
    return { items };
  }
}
