import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/drizzle';
import { studyProgress } from '@server/database/schema';
import { and, asc, eq } from 'drizzle-orm';
import type { ProgressDTO, SaveProgressRequest } from '@shared/api.interface';
import { AccountService } from '../account/account.service';

type ProgressRow = typeof studyProgress.$inferSelect;

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly accountService: AccountService,
  ) {}

  private toDTO(row: ProgressRow): ProgressDTO {
    return {
      id: row.id,
      studentUserId: row.studentUserId,
      subject: row.subject,
      chapter: row.chapter,
      percent: row.percent,
      currentPoint: row.currentPoint ?? '',
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(studentUserId: string): Promise<ProgressDTO[]> {
    const rows: ProgressRow[] = await this.db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.studentUserId, studentUserId))
      .orderBy(asc(studyProgress.subject), asc(studyProgress.id));
    return rows.map((row: ProgressRow) => this.toDTO(row));
  }

  async save(dto: SaveProgressRequest, userId: string): Promise<ProgressDTO> {
    const me = await this.accountService.findProfile(userId);
    if (!me || (me.role !== 'teacher' && me.role !== 'admin')) {
      throw new ForbiddenException('只有老师或管理员可以更新学习进度');
    }
    if (me.role === 'teacher') {
      const allowed = await this.accountService.canTeachStudent(
        userId,
        dto.studentUserId,
      );
      if (!allowed) {
        throw new ForbiddenException('该学生不在你的带班范围内');
      }
    }
    const percent = Math.max(0, Math.min(100, Math.round(dto.percent)));
    const existing: ProgressRow[] = await this.db
      .select()
      .from(studyProgress)
      .where(
        and(
          eq(studyProgress.studentUserId, dto.studentUserId),
          eq(studyProgress.subject, dto.subject),
          eq(studyProgress.chapter, dto.chapter),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const updated: ProgressRow[] = await this.db
        .update(studyProgress)
        .set({
          percent,
          currentPoint: dto.currentPoint ?? existing[0].currentPoint,
          updatedByUserId: userId,
        })
        .where(eq(studyProgress.id, existing[0].id))
        .returning();
      return this.toDTO(updated[0]);
    }

    const inserted: ProgressRow[] = await this.db
      .insert(studyProgress)
      .values({
        studentUserId: dto.studentUserId,
        subject: dto.subject,
        chapter: dto.chapter,
        percent,
        currentPoint: dto.currentPoint ?? null,
        updatedByUserId: userId,
      })
      .returning();
    return this.toDTO(inserted[0]);
  }
}
