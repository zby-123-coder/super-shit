/**
 * 全局 Express 请求类型增强（替代平台注入的类型）。
 * AuthMiddleware 解析 token 后写入 userContext，业务 controller 直接读取。
 */
import type { UserRole } from '@shared/api.interface';

declare module 'express' {
  interface Request {
    userContext?: {
      userId: string;
      role: UserRole;
    };
  }
}
