/* 前后端共享的类型写在这里 —— 家教团队学习管理平台 */

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export interface RegisterRequest {
  loginName: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  grade?: string;
  subjectTags?: string;
}

export interface LoginRequest {
  loginName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  role: UserRole;
  name: string;
  inviteCode: string;
}

export const USER_ROLE_LIST: UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
];

export type CourseStatus = 'pending' | 'done' | 'leave';

export type CheckinStatus = 'submitted' | 'approved' | 'rejected';

export type ArticleColumn = 'case' | 'trial' | 'tour' | 'news';

export type ArticleStatus = 'published' | 'offline';

export interface AppProfileDTO {
  id: string;
  userId: string;
  role: UserRole;
  name: string;
  phone: string;
  grade: string;
  subjectTags: string;
  avatarUrl: string;
  inviteCode: string;
}

export interface RelatedUserDTO {
  userId: string;
  name: string;
  grade: string;
  role: UserRole;
}

export interface AccountMeResponse {
  profile: AppProfileDTO | null;
  children: RelatedUserDTO[];
  students: RelatedUserDTO[];
  guardians: RelatedUserDTO[];
}

export interface SaveProfileRequest {
  role: UserRole;
  name: string;
  phone?: string;
  grade?: string;
  subjectTags?: string;
  avatarUrl?: string;
}

export interface BindByCodeRequest {
  inviteCode: string;
}

export interface BindItemDTO {
  id: string;
  userId: string;
  name: string;
  grade: string;
}

export interface CourseDTO {
  id: string;
  studentUserId: string;
  studentName: string;
  teacherUserId: string;
  teacherName: string;
  subject: string;
  startAt: string;
  endAt: string;
  location: string;
  status: CourseStatus;
  lessonCount: number;
  remark: string;
}

export interface CourseWeekResponse {
  weekStart: string;
  weekEnd: string;
  items: CourseDTO[];
}

export interface CreateCourseRequest {
  studentUserId: string;
  teacherUserId?: string;
  subject: string;
  startAt: string;
  endAt: string;
  location?: string;
  lessonCount?: number;
  remark?: string;
}

export interface UpdateCourseStatusRequest {
  status: CourseStatus;
  remark?: string;
}

export interface LessonAccountDTO {
  subject: string;
  totalLessons: number;
  usedLessons: number;
  remaining: number;
  alertThreshold: number;
}

export interface LessonLedgerDTO {
  id: string;
  subject: string;
  changeAmount: number;
  changeType: 'purchase' | 'consume' | 'adjust';
  remark: string;
  createdAt: string;
}

export interface LessonSummaryResponse {
  accounts: LessonAccountDTO[];
  ledgers: LessonLedgerDTO[];
}

export interface GrantLessonRequest {
  studentUserId: string;
  subject: string;
  amount: number;
  remark?: string;
}

export interface CheckinDTO {
  id: string;
  taskId: string;
  studentUserId: string;
  studentName: string;
  content: string;
  imageUrls: string[];
  durationMin: number;
  status: CheckinStatus;
  reviewComment: string;
  createdAt: string;
}

export interface TaskDTO {
  id: string;
  teacherUserId: string;
  teacherName: string;
  studentUserId: string;
  studentName: string;
  subject: string;
  title: string;
  content: string;
  dueAt: string;
  status: 'open' | 'submitted' | 'approved' | 'rejected';
  checkin: CheckinDTO | null;
  createdAt: string;
}

export interface TaskListResponse {
  items: TaskDTO[];
  pendingCount: number;
  doneCount: number;
  streakDays: number;
}

export interface CreateTaskRequest {
  studentUserId: string;
  subject?: string;
  title: string;
  content?: string;
  dueAt?: string;
}

export interface CreateCheckinRequest {
  content?: string;
  imageUrls?: string[];
  durationMin?: number;
}

export interface ReviewCheckinRequest {
  status: 'approved' | 'rejected';
  comment?: string;
}

export interface ProgressDTO {
  id: string;
  studentUserId: string;
  subject: string;
  chapter: string;
  percent: number;
  currentPoint: string;
  updatedAt: string;
}

export interface SaveProgressRequest {
  studentUserId: string;
  subject: string;
  chapter: string;
  percent: number;
  currentPoint?: string;
}

export interface ArticleDTO {
  id: string;
  title: string;
  columnType: ArticleColumn;
  coverUrl: string;
  summary: string;
  content: string;
  status: ArticleStatus;
  pinned: boolean;
  readCount: number;
  authorName: string;
  favorited: boolean;
  createdAt: string;
}

export interface ArticleListResponse {
  items: ArticleDTO[];
}

export interface SaveArticleRequest {
  title: string;
  columnType: ArticleColumn;
  coverUrl?: string;
  summary?: string;
  content: string;
  pinned?: boolean;
}

export interface MessageDTO {
  id: string;
  msgType: string;
  title: string;
  content: string;
  linkPath: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageListResponse {
  items: MessageDTO[];
  unreadCount: number;
}

export interface AdminOverview {
  userCount: number;
  studentCount: number;
  teacherCount: number;
  parentCount: number;
  weekCourseCount: number;
  pendingCheckinCount: number;
  articleCount: number;
  consumedLessons: number;
}

export interface AdminUserDTO {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  phone: string;
  grade: string;
  inviteCode: string;
  createdAt: string;
}

export interface AdminUserListResponse {
  items: AdminUserDTO[];
}

export interface UpdateAdminUserRequest {
  name?: string;
  role?: UserRole;
  phone?: string;
  grade?: string;
  subjectTags?: string;
}

export interface AssignRelationRequest {
  teacherUserId?: string;
  parentUserId?: string;
  studentUserId: string;
  subject?: string;
}

export interface BroadcastRequest {
  title: string;
  content: string;
  role?: UserRole;
}
