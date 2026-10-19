/* 前后端共享的类型写在这里 —— 家教团队学习管理平台 */

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export interface WeeklyReportSection {
  title: string;
  lines: string[];
}

export interface DiagnosisDimension {
  key: string;
  label: string;
  score: number;
  detail: string;
}

export interface DiagnosisReasonCount {
  reason: string;
  count: number;
}

export interface DiagnosisPrescription {
  action: string;
  reason: string;
}

export interface Diagnosis {
  studentUserId: string;
  studentName: string;
  days: number;
  generatedAt: string;
  dimensions: DiagnosisDimension[];
  topReasons: DiagnosisReasonCount[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  prescriptions: DiagnosisPrescription[];
  /** 样本量提示：数据不足时前端应显示谨慎结论 */
  sampleSize: number;
  sampleSufficient: boolean;
}

export interface WeeklyReport {
  studentName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    taskTotal: number;
    taskApproved: number;
    checkinCount: number;
    totalMinutes: number;
    courseDone: number;
    consumedLessons: number;
    purchasedLessons: number;
    remainingLessons: number;
  };
  sections: WeeklyReportSection[];
  /** 纯文本版，便于一键复制分享 */
  text: string;
}

export interface WrongQuestionDTO {
  id: string;
  studentUserId: string;
  studentName: string;
  subject: string;
  chapter: string;
  title: string;
  reason: string;
  knowledgePoint: string;
  status: 'open' | 'corrected' | 'mastered';
  createdAt: string;
  /** 复习排期：当前轮次 / 已完成轮次 / 下次复习时间（无排期为 null） */
  reviewStage: number;
  reviewCount: number;
  nextReviewAt: string | null;
}

export interface SaveWrongQuestionRequest {
  studentUserId?: string;
  subject: string;
  chapter?: string;
  title: string;
  reason?: string;
  knowledgePoint?: string;
}

export interface RegisterRequest {
  loginName: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  grade?: string;
  subjectTags?: string;
  /** 学生注册必须提供：要加入的家庭邀请码 */
  familyInviteCode?: string;
}

export interface FamilyDTO {
  id: string;
  name: string;
  inviteCode: string;
  ownerUserId: string;
  parents: RelatedUserDTO[];
  students: RelatedUserDTO[];
}

/** 户主在家庭内直接创建孩子账号 */
export interface CreateChildRequest {
  loginName: string;
  password: string;
  name: string;
  grade?: string;
}

export interface LoginRequest {
  loginName: string;
  password: string;
}

export interface OpsPostDraft {
  platform: string;
  title: string;
  text: string;
}

export interface OpsGenerateRequest {
  grade: string;
  region: string;
  subject: string;
  material?: string;
  saveDraft?: boolean;
}

export interface OpsGenerateResponse {
  available: boolean;
  summary: string;
  posts: OpsPostDraft[];
  draftId: string | null;
}

export interface ExplainStep {
  phase: 'read' | 'hint' | 'explain';
  text: string;
}

export interface ExplainResult {
  available: boolean;
  steps: ExplainStep[];
  similarTip: string;
  encouragement: string;
}

export interface QuestionBankItem {
  id: string;
  subject: string;
  chapter: string;
  knowledgePoint: string;
  title: string;
  answer: string;
  analysis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
}

export interface RecommendQuestionsRequest {
  subject: string;
  knowledgePoint: string;
  chapter?: string;
  count?: number;
}

export interface HomeworkGradeItem {
  questionNo: string;
  isCorrect: boolean;
  errorType?: string;
  comment: string;
}

export interface HomeworkGradeResult {
  available: boolean;
  items: HomeworkGradeItem[];
  summary: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  role: UserRole;
  name: string;
  inviteCode: string;
  familyName: string;
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
  notifyMute: boolean;
  familyId: string | null;
  familyName: string | null;
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
  family: FamilyDTO | null;
}

export interface SaveProfileRequest {
  role: UserRole;
  name: string;
  phone?: string;
  grade?: string;
  subjectTags?: string;
  avatarUrl?: string;
  /** 免打扰：普通通知不再送达，重要通知（消课确认/课时预警）仍送达 */
  notifyMute?: boolean;
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
  /** 家长/学生确认时间（消课双向确认） */
  confirmedAt: string | null;
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
  /** 单个学生（兼容旧用法）；批量请用 studentUserIds */
  studentUserId?: string;
  /** 批量布置时的学生列表 */
  studentUserIds?: string[];
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
  priority: 'urgent' | 'normal';
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
