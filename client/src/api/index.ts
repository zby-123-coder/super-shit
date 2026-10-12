import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { clearToken, getToken } from '@client/src/utils/auth-token';
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
  BindItemDTO,
  CheckinDTO,
  CourseDTO,
  CourseWeekResponse,
  CreateCourseRequest,
  CreateTaskRequest,
  GrantLessonRequest,
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
} from '@shared/api.interface';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number | undefined>;
}

async function request<T>(config: RequestConfig): Promise<T> {
  const token = getToken();
  try {
    const response = await axiosForBackend({
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data as T;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      clearToken();
    }
    logger.error(`请求失败：${config.url}`, error);
    throw error;
  }
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
  bind: (inviteCode: string): Promise<{ name: string }> =>
    request({
      url: '/api/account/bind',
      method: 'POST',
      data: { inviteCode },
    }),
  unbind: (id: string): Promise<{ success: boolean }> =>
    request({ url: `/api/account/bind/${id}`, method: 'DELETE' }),
  listBindings: (): Promise<{
    children: BindItemDTO[];
    students: BindItemDTO[];
    guardians: BindItemDTO[];
  }> => request({ url: '/api/account/bindings', method: 'GET' }),
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
};

export const taskApi = {
  list: (): Promise<TaskListResponse> =>
    request({ url: '/api/task', method: 'GET' }),
  create: (data: CreateTaskRequest): Promise<TaskDTO[]> =>
    request({ url: '/api/task', method: 'POST', data }),
  checkin: (id: string, data: {
    content?: string;
    durationMin?: number;
  }): Promise<CheckinDTO> =>
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

export const reportApi = {
  weekly: (studentUserId?: string): Promise<WeeklyReport> =>
    request({
      url: '/api/report/weekly',
      method: 'GET',
      params: { studentUserId },
    }),
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
