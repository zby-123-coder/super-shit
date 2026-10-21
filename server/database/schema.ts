/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const noticeMessage = pgTable("notice_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  msgType: varchar("msg_type", { length: 32 }).notNull().default('system'),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  linkPath: varchar("link_path", { length: 255 }),
  isRead: boolean("is_read").notNull().default(false),
  priority: varchar("priority", { length: 16 }).notNull().default('normal'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_message_user").on(table.userId, table.createdAt),
]);

export const articleFavorite = pgTable("article_favorite", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  articleId: uuid("article_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_favorite").on(table.userId, table.articleId),
]);

export const article = pgTable("article", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  columnType: varchar("column_type", { length: 32 }).notNull().default('news'),
  coverUrl: text("cover_url"),
  summary: text("summary"),
  content: text("content").notNull(),
  status: varchar("status", { length: 32 }).notNull().default('published'),
  pinned: boolean("pinned").notNull().default(false),
  readCount: integer("read_count").notNull().default(0),
  authorUserId: varchar("author_user_id", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_article_column").on(table.columnType, table.createdAt),
]);

export const taskCheckin = pgTable("task_checkin", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  content: text("content"),
  imageUrls: text("image_urls").array(),
  durationMin: integer("duration_min"),
  status: varchar("status", { length: 32 }).notNull().default('submitted'),
  reviewComment: text("review_comment"),
  reviewedByUserId: varchar("reviewed_by_user_id", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_checkin_task").on(table.taskId),
  index("idx_checkin_student").on(table.studentUserId, table.createdAt),
]);

export const studyTask = pgTable("study_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherUserId: varchar("teacher_user_id", { length: 64 }).notNull(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  dueAt: customTimestamptz("due_at", { precision: 3 }),
  status: varchar("status", { length: 32 }).notNull().default('open'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_task_student").on(table.studentUserId, table.dueAt),
  index("idx_task_teacher").on(table.teacherUserId, table.dueAt),
]);

export const studyProgress = pgTable("study_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }).notNull(),
  chapter: varchar("chapter", { length: 255 }).notNull(),
  percent: integer("percent").notNull().default(0),
  currentPoint: varchar("current_point", { length: 255 }),
  updatedByUserId: varchar("updated_by_user_id", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_progress_chapter").on(table.studentUserId, table.subject, table.chapter),
]);

export const lessonLedger = pgTable("lesson_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }).notNull(),
  changeAmount: integer("change_amount").notNull(),
  changeType: varchar("change_type", { length: 32 }).notNull(),
  courseId: uuid("course_id"),
  operatorUserId: varchar("operator_user_id", { length: 64 }),
  remark: text("remark"),
  confirmedAt: customTimestamptz("confirmed_at", { precision: 3 }),
  confirmedBy: varchar("confirmed_by", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ledger_student").on(table.studentUserId, table.createdAt),
]);

export const lessonAccount = pgTable("lesson_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }).notNull(),
  totalLessons: integer("total_lessons").notNull().default(0),
  usedLessons: integer("used_lessons").notNull().default(0),
  alertThreshold: integer("alert_threshold").notNull().default(3),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_lesson_account").on(table.studentUserId, table.subject),
]);

export const course = pgTable("course", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  teacherUserId: varchar("teacher_user_id", { length: 64 }),
  subject: varchar("subject", { length: 64 }).notNull(),
  startAt: customTimestamptz("start_at", { precision: 3 }).notNull(),
  endAt: customTimestamptz("end_at", { precision: 3 }).notNull(),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default('pending'),
  lessonCount: integer("lesson_count").notNull().default(1),
  remark: text("remark"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_course_student").on(table.studentUserId, table.startAt),
  index("idx_course_teacher").on(table.teacherUserId, table.startAt),
]);

export const teachingLink = pgTable("teaching_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherUserId: varchar("teacher_user_id", { length: 64 }).notNull(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_teaching_pair").on(table.teacherUserId, table.studentUserId),
]);

export const guardianLink = pgTable("guardian_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentUserId: varchar("parent_user_id", { length: 64 }).notNull(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  relationType: varchar("relation_type", { length: 32 }).notNull().default('parent'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_guardian_pair").on(table.parentUserId, table.studentUserId),
]);

export const family = pgTable("family", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull(),
  ownerUserId: varchar("owner_user_id", { length: 64 }).notNull(),
  inviteCode: varchar("invite_code", { length: 16 }).notNull().unique(),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  uniqueIndex("uk_family_invite").on(table.inviteCode),
]);

export const appProfile = pgTable("app_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  role: varchar("role", { length: 32 }).notNull().default('student'),
  name: varchar("name", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  grade: varchar("grade", { length: 32 }),
  subjectTags: varchar("subject_tags", { length: 255 }),
  avatarUrl: text("avatar_url"),
  inviteCode: varchar("invite_code", { length: 16 }).unique(),
  notifyMute: boolean("notify_mute").notNull().default(false),
  familyId: uuid("family_id"),
  wechatOpenid: varchar("wechat_openid", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_app_profile_user").on(table.userId),
  uniqueIndex("uk_app_profile_invite").on(table.inviteCode),
]);

/* 以下两张表由 scripts/auth-migration.sql 建立，将来在任意 Postgres 环境执行该脚本后
   可用 `npm run gen:db-schema` 重新生成，届时以生成结果为准 */
export const authCredential = pgTable("auth_credential", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  loginName: varchar("login_name", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_auth_credential_user").on(table.userId),
  uniqueIndex("uk_auth_credential_login").on(table.loginName),
]);

export const authSession = pgTable("auth_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  deviceLabel: varchar("device_label", { length: 255 }),
  expiresAt: customTimestamptz("expires_at", { precision: 3 }).notNull(),
  revokedAt: customTimestamptz("revoked_at", { precision: 3 }),
  lastUsedAt: customTimestamptz("last_used_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: varchar("_created_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: varchar("_updated_by", { length: 64 }).default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("uk_auth_session_token").on(table.tokenHash),
  index("idx_auth_session_user").on(table.userId),
]);

export const wrongQuestion = pgTable("wrong_question", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 64 }).notNull(),
  chapter: varchar("chapter", { length: 255 }),
  title: varchar("title", { length: 500 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  knowledgePoint: varchar("knowledge_point", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default('open'),
  reviewStage: integer("review_stage").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: customTimestamptz("next_review_at", { precision: 3 }),
  lastReviewAt: customTimestamptz("last_review_at", { precision: 3 }),
  reviewTaskId: uuid("review_task_id"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  index("idx_wq_student").on(table.studentUserId, table.createdAt),
  index("idx_wq_review").on(table.nextReviewAt),
]);

export const questionBank = pgTable("question_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 64 }).notNull(),
  chapter: varchar("chapter", { length: 255 }),
  knowledgePoint: varchar("knowledge_point", { length: 255 }),
  title: text("title").notNull(),
  answer: text("answer"),
  analysis: text("analysis"),
  difficulty: varchar("difficulty", { length: 16 }).notNull().default('medium'),
  source: varchar("source", { length: 32 }).notNull().default('manual'),
  useCount: integer("use_count").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  index("idx_qb_kp").on(table.subject, table.knowledgePoint),
]);

export const aiSession = pgTable("ai_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  wrongQuestionId: uuid("wrong_question_id"),
  personaId: varchar("persona_id", { length: 32 }).notNull().default('guide'),
  stage: varchar("stage", { length: 32 }).notNull().default('understand'),
  status: varchar("status", { length: 16 }).notNull().default('active'),
  topic: varchar("topic", { length: 255 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  index("idx_ai_session_student").on(table.studentUserId, table.createdAt),
]);

export const aiMessage = pgTable("ai_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  stageAtTime: varchar("stage_at_time", { length: 32 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  index("idx_ai_message_session").on(table.sessionId, table.createdAt),
]);

export const studentInsight = pgTable("student_insight", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  level: varchar("level", { length: 16 }).notNull(),
  score: integer("score").notNull().default(0),
  signals: jsonb("signals").notNull().default(sql`'{}'::jsonb`),
  headline: varchar("headline", { length: 500 }),
  evidence: jsonb("evidence").notNull().default(sql`'[]'::jsonb`),
  actions: jsonb("actions").notNull().default(sql`'[]'::jsonb`),
  executed: boolean("executed").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  index("idx_insight_student").on(table.studentUserId, table.createdAt),
]);

export const admissionSchool = pgTable("admission_school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull(),
  city: varchar("city", { length: 64 }),
  province: varchar("province", { length: 64 }),
  level: varchar("level", { length: 64 }),
  tags: text("tags").array(),
  intro: text("intro"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [uniqueIndex("uk_admission_school").on(table.name)]);

export const admissionMajor = pgTable("admission_major", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }),
  requiredSubjects: text("required_subjects").array(),
  optionalSubjects: text("optional_subjects").array(),
  employment: text("employment").array(),
  intro: text("intro"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [uniqueIndex("uk_admission_major").on(table.name)]);

export const aiInvocationLog = pgTable("ai_invocation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 调用 ID（回给前端，用于回看这次调用） */
  callId: uuid("call_id").notNull().defaultRandom(),
  /** 发起者（按用户隔离：只查得到自己的记录） */
  userId: varchar("user_id", { length: 64 }).notNull(),
  role: varchar("role", { length: 16 }),
  /** 功能标识：diagnosis/explain/review_draft/variant/grade_homework/companion/weekly/ops/insight */
  feature: varchar("feature", { length: 32 }).notNull(),
  /** 作用范围：如 wrong_question_id / task_id / subject */
  scopeType: varchar("scope_type", { length: 32 }),
  scopeId: varchar("scope_id", { length: 255 }),
  provider: varchar("provider", { length: 16 }).notNull().default('llm'),
  /** success 正常 / degraded 降级规则版 / failed 失败 */
  status: varchar("status", { length: 16 }).notNull().default('success'),
  latencyMs: integer("latency_ms"),
  resultPreview: text("result_preview"),
  /** 完整结果快照（前端可回看本次调用的完整输出） */
  resultFull: text("result_full"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_ai_log_user").on(table.userId, table.createdAt),
  index("idx_ai_log_feature").on(table.userId, table.feature),
]);

export const aiMemory = pgTable("ai_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 记忆归属学生（严格按学生隔离，家长/老师不能写入他人记忆） */
  studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
  /** weakness 薄弱点 / preference 偏好 / style 风格 / progress 进度 / fact 事实 */
  kind: varchar("kind", { length: 24 }).notNull().default('fact'),
  content: varchar("content", { length: 500 }).notNull(),
  /** 重要度 1-5，注入 prompt 时取最高的几条 */
  importance: integer("importance").notNull().default(3),
  source: varchar("source", { length: 64 }),
  hits: integer("hits").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uk_ai_memory").on(table.studentUserId, table.content),
  index("idx_ai_memory_student").on(table.studentUserId, table.importance),
]);

export const educationKb = pgTable("education_kb", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** gaokao 高考 / zhongkao 中考 */
  stage: varchar("stage", { length: 16 }).notNull().default('gaokao'),
  /** policy 政策 / zhiyuan 志愿填报 / xuanke 选科 / timeline 时间线 / special 特殊招生 / faq 常见问题 */
  category: varchar("category", { length: 32 }).notNull().default('faq'),
  /** 适用地域：全国 / 省份 / 城市 */
  region: varchar("region", { length: 64 }).notNull().default('全国'),
  title: varchar("title", { length: 255 }).notNull(),
  /** FAQ 的原始问法（智能客服检索时优先匹配用户问句） */
  question: text("question"),
  content: text("content").notNull(),
  /** 检索关键词（关键词检索的第一层；RAG 接入后此字段转为语料标签） */
  keywords: text("keywords").array(),
  /** 信息来源（站点/文件），公开发布前需人工核实 */
  source: varchar("source", { length: 255 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("_created_by", { length: 64 }),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: varchar("_updated_by", { length: 64 }),
}, (table) => [
  uniqueIndex("uk_edu_kb_title").on(table.stage, table.title),
  index("idx_kb_stage_category").on(table.stage, table.category),
]);

// table aliases
export const appProfileTable = appProfile;
export const articleTable = article;
export const articleFavoriteTable = articleFavorite;
export const courseTable = course;
export const guardianLinkTable = guardianLink;
export const lessonAccountTable = lessonAccount;
export const lessonLedgerTable = lessonLedger;
export const noticeMessageTable = noticeMessage;
export const studyProgressTable = studyProgress;
export const studyTaskTable = studyTask;
export const taskCheckinTable = taskCheckin;
export const teachingLinkTable = teachingLink;
