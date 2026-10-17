import { http } from '@client/src/utils/http';
import type {
  AccountMeResponse,
  AdminOverview,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AdminUserListResponse,
  AdminUserDTO,
  AppProfileDTO,
  ArticleDTO,
  ArticleListResponse,
  AssignRelationRequest,
  CheckinDTO,
  CreateCheckinRequest,
  CreateChildRequest,
  FamilyDTO,
  CourseDTO,
  CourseWeekResponse,
  CreateCourseRequest,
  CreateTaskRequest,
  GrantLessonRequest,
  HomeworkGradeResult,
  OpsGenerateRequest,
  OpsGenerateResponse,
  QuestionBankItem,
  RecommendQuestionsRequest,
  LessonSummaryResponse,
  MessageListResponse,
  ProgressDTO,
  SaveArticleRequest,
  SaveProfileRequest,
  SaveProgressRequest,
  TaskDTO,
  TaskListResponse,
  UpdateAdminUserRequest,
  UpdateCourseStatusRequest,
  WeeklyReport,
  WrongQuestionDTO,
  SaveWrongQuestionRequest,
} from '@shared/api.interface';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number | undefined>;
}

async function request<T>(config: RequestConfig): Promise<T> {
  const response = await http({
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
  });
  return response.data as T;
}

export const authApi = {
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    request({ url: '/api/auth/register', method: 'POST', data }),
  login: (data: LoginRequest): Promise<AuthResponse> =>
    request({ url: '/api/auth/login', method: 'POST', data }),
  logout: (): Promise<{ success: boolean }> =>
    request({ url: '/api/auth/logout', method: 'POST' }),
};

export const accountApi = {
  getMe: (): Promise<AccountMeResponse> =>
    request({ url: '/api/account/me', method: 'GET' }),
  saveProfile: (data: SaveProfileRequest): Promise<AppProfileDTO> =>
    request({ url: '/api/account/profile', method: 'POST', data }),
  createChild: (data: CreateChildRequest): Promise<AppProfileDTO> =>
    request({ url: '/api/account/child', method: 'POST', data }),
  getFamily: (): Promise<FamilyDTO | null> =>
    request({ url: '/api/account/family', method: 'GET' }),
  addStudent: (
    inviteCode: string,
  ): Promise<{ success: boolean; studentName: string }> =>
    request({
      url: '/api/account/teach',
      method: 'POST',
      data: { inviteCode },
    }),
};

export const courseApi = {
  getWeek: (weekStart?: string): Promise<CourseWeekResponse> =>
    request({
      url: '/api/course/week',
      method: 'GET',
      params: { weekStart },
    }),
  getLessons: (studentUserId?: string): Promise<LessonSummaryResponse> =>
    request({
      url: '/api/course/lessons',
      method: 'GET',
      params: { studentUserId },
    }),
  create: (data: CreateCourseRequest): Promise<CourseDTO> =>
    request({ url: '/api/course', method: 'POST', data }),
  updateStatus: (
    id: string,
    data: UpdateCourseStatusRequest,
  ): Promise<CourseDTO> =>
    request({ url: `/api/course/${id}/status`, method: 'PATCH', data }),
  consume: (id: string): Promise<{ remaining: number }> =>
    request({ url: `/api/course/${id}/consume`, method: 'POST' }),
  grant: (data: GrantLessonRequest): Promise<{ success: boolean }> =>
    request({
      url: '/api/course/lessons/grant',
      method: 'POST',
      data,
    }),
  confirmLedger: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/course/ledger/${id}/confirm`, method: 'PATCH' }),
};

export const taskApi = {
  list: (): Promise<TaskListResponse> =>
    request({ url: '/api/task', method: 'GET' }),
  create: (data: CreateTaskRequest): Promise<TaskDTO[]> =>
    request({ url: '/api/task', method: 'POST', data }),
  checkin: (id: string, data: CreateCheckinRequest): Promise<CheckinDTO> =>
    request({
      url: `/api/task/${id}/checkin`,
      method: 'POST',
      data,
    }),
  review: (
    id: string,
    data: { status: 'approved' | 'rejected'; comment?: string },
  ): Promise<{ success: boolean }> =>
    request({
      url: `/api/task/checkin/${id}/review`,
      method: 'PATCH',
      data,
    }),
};

export const progressApi = {
  list: (studentUserId?: string): Promise<ProgressDTO[]> =>
    request({
      url: '/api/progress',
      method: 'GET',
      params: { studentUserId },
    }),
  save: (data: SaveProgressRequest): Promise<ProgressDTO> =>
    request({ url: '/api/progress', method: 'POST', data }),
};

export const contentApi = {
  list: (columnType?: string): Promise<ArticleListResponse> =>
    request({
      url: '/api/content',
      method: 'GET',
      params: { columnType },
    }),
  listAll: (): Promise<ArticleListResponse> =>
    request({
      url: '/api/content',
      method: 'GET',
      params: { includeOffline: 'true' },
    }),
  detail: (id: string): Promise<ArticleDTO> =>
    request({ url: `/api/content/${id}`, method: 'GET' }),
  create: (data: SaveArticleRequest): Promise<ArticleDTO> =>
    request({ url: '/api/content', method: 'POST', data }),
  update: (id: string, data: SaveArticleRequest): Promise<ArticleDTO> =>
    request({ url: `/api/content/${id}`, method: 'PATCH', data }),
  setStatus: (
    id: string,
    status: 'published' | 'offline',
  ): Promise<{ success: boolean }> =>
    request({ url: `/api/content/${id}/status`, method: 'PATCH', data: { status } }),
  remove: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/content/${id}`, method: 'DELETE' }),
  toggleFavorite: (
    id: string,
  ): Promise<{ favorited: boolean }> =>
    request({ url: `/api/content/${id}/favorite`, method: 'POST' }),
};

export const messageApi = {
  list: (): Promise<MessageListResponse> =>
    request({ url: '/api/message', method: 'GET' }),
  markRead: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/message/${id}/read`, method: 'PATCH' }),
  markAllRead: (): Promise<{ success: boolean }> =>
    request({ url: '/api/message/read-all', method: 'PATCH' }),
  broadcast: (data: {
    title: string;
    content: string;
    role?: string;
  }): Promise<{ success: boolean; count: number }> =>
    request({ url: '/api/message/broadcast', method: 'POST', data }),
};

export const wrongQuestionApi = {
  list: (studentUserId?: string): Promise<WrongQuestionDTO[]> =>
    request({
      url: '/api/wrong-question',
      method: 'GET',
      params: { studentUserId },
    }),
  create: (data: SaveWrongQuestionRequest): Promise<WrongQuestionDTO> =>
    request({ url: '/api/wrong-question', method: 'POST', data }),
  markCorrected: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/wrong-question/${id}/corrected`, method: 'PATCH' }),
  remove: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/wrong-question/${id}`, method: 'DELETE' }),
};

export const reportApi = {
  weekly: (studentUserId?: string): Promise<WeeklyReport> =>
    request({
      url: '/api/report/weekly',
      method: 'GET',
      params: { studentUserId },
    }),
};

export const uploadApi = {
  image: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await http.post('/api/upload/image', form);
    return response.data as { url: string };
  },
};

export const opsApi = {
  dailyTips: (): Promise<{ date: string; tips: { topic: string; reason: string }[] }> =>
    request({ url: '/api/ops/daily-tips', method: 'GET' }),
  drafts: (): Promise<{ id: string; title: string; summary: string }[]> =>
    request({ url: '/api/ops/drafts', method: 'GET' }),
  generate: (data: OpsGenerateRequest): Promise<OpsGenerateResponse> =>
    request({ url: '/api/ops/generate', method: 'POST', data }),
};

export const questionBankApi = {
  list: (params?: { subject?: string; knowledgePoint?: string }): Promise<QuestionBankItem[]> =>
    request({ url: '/api/question-bank', method: 'GET', params }),
  recommend: (data: RecommendQuestionsRequest): Promise<QuestionBankItem[]> =>
    request({ url: '/api/question-bank/recommend', method: 'POST', data }),
  create: (data: {
    subject: string;
    chapter?: string;
    knowledgePoint?: string;
    title: string;
    answer?: string;
    analysis?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<QuestionBankItem> =>
    request({ url: '/api/question-bank', method: 'POST', data }),
};

export const aiApi = {
  status: (): Promise<{ provider: string }> =>
    request({ url: '/api/ai/status', method: 'GET' }),
  reviewDraft: (data: {
    content: string;
    durationMin: number;
    taskTitle: string;
  }): Promise<{ draft: string }> =>
    request({ url: '/api/ai/review-draft', method: 'POST', data }),
  variant: (data: {
    subject: string;
    title: string;
    knowledgePoint?: string;
  }): Promise<{ variant: string | null }> =>
    request({ url: '/api/ai/variant', method: 'POST', data }),
  gradeHomework: (taskId: string): Promise<HomeworkGradeResult> =>
    request({ url: `/api/ai/grade-homework/${taskId}`, method: 'POST' }),
};

export const demoApi = {
  status: (): Promise<boolean> =>
    request({ url: '/api/demo/status', method: 'GET' }),
  seed: (): Promise<{ created: number }> =>
    request({ url: '/api/demo/seed', method: 'POST' }),
  clear: (): Promise<{ removed: number }> =>
    request({ url: '/api/demo/clear', method: 'POST' }),
};

export const adminApi = {
  overview: (): Promise<AdminOverview> =>
    request({ url: '/api/admin/overview', method: 'GET' }),
  users: (): Promise<AdminUserListResponse> =>
    request({ url: '/api/admin/users', method: 'GET' }),
  updateUser: (
    id: string,
    data: UpdateAdminUserRequest,
  ): Promise<AdminUserDTO> =>
    request({ url: `/api/admin/users/${id}`, method: 'PATCH', data }),
  assign: (
    data: AssignRelationRequest,
  ): Promise<{ success: boolean }> =>
    request({ url: '/api/admin/assign', method: 'POST', data }),
};
