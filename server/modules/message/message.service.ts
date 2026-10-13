import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import { appProfile, noticeMessage } from '@server/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import type {
  MessageDTO,
  MessageListResponse,
  UserRole,
} from '@shared/api.interface';

type MessageRow = typeof noticeMessage.$inferSelect;

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toDTO(row: MessageRow): MessageDTO {
    return {
      id: row.id,
      msgType: row.msgType,
      title: row.title,
      content: row.content ?? '',
      linkPath: row.linkPath ?? '',
      isRead: row.isRead,
      priority: (row.priority ?? 'normal') as 'urgent' | 'normal',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async notify(params: {
    userId: string;
    msgType: string;
    title: string;
    content: string;
    linkPath?: string;
    /** urgent = 免打扰模式下仍然送达 */
    priority?: 'urgent' | 'normal';
  }): Promise<void> {
    try {
      const priority = params.priority ?? 'normal';
      if (priority !== 'urgent') {
        const profiles = await this.db
          .select({ notifyMute: appProfile.notifyMute })
          .from(appProfile)
          .where(eq(appProfile.userId, params.userId))
          .limit(1);
        if (profiles.length > 0 && profiles[0].notifyMute) {
          return;
        }
      }
      await this.db.insert(noticeMessage).values({
        userId: params.userId,
        msgType: params.msgType,
        title: params.title,
        content: params.content,
        linkPath: params.linkPath ?? null,
        priority,
      });
    } catch (error) {
      this.logger.error('写入站内消息失败', JSON.stringify(error));
    }
  }

  async list(userId: string): Promise<MessageListResponse> {
    const rows: MessageRow[] = await this.db
      .select()
      .from(noticeMessage)
      .where(eq(noticeMessage.userId, userId))
      .orderBy(desc(noticeMessage.createdAt))
      .limit(50);
    const unreadRows = await this.db
      .select({ id: noticeMessage.id })
      .from(noticeMessage)
      .where(
        and(
          eq(noticeMessage.userId, userId),
          eq(noticeMessage.isRead, false),
        ),
      )
      .limit(100);
    return {
      items: rows.map((row: MessageRow) => this.toDTO(row)),
      unreadCount: unreadRows.length,
    };
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.db
      .update(noticeMessage)
      .set({ isRead: true })
      .where(and(eq(noticeMessage.id, id), eq(noticeMessage.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db
      .update(noticeMessage)
      .set({ isRead: true })
      .where(eq(noticeMessage.userId, userId));
  }

  async broadcast(params: {
    title: string;
    content: string;
    role?: UserRole;
  }): Promise<number> {
    const conditions = params.role
      ? eq(appProfile.role, params.role)
      : undefined;
    const profiles = await this.db
      .select({ userId: appProfile.userId })
      .from(appProfile)
      .where(conditions);
    let count = 0;
    for (const profile of profiles) {
      await this.notify({
        userId: profile.userId,
        msgType: 'broadcast',
        title: params.title,
        content: params.content,
        linkPath: '/messages',
      });
      count += 1;
    }
    return count;
  }
}
