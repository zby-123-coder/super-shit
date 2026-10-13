import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

/**
 * 统一鉴权：解析 Bearer token → 写入 req.userContext.userId，让业务代码零改动。
 * 除注册/登录外，所有 /api 请求都必须携带有效会话。
 * 注意：部署后路径带 /app/<app_id> 前缀，必须用 originalUrl 匹配。
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const raw = (req.originalUrl || req.url || '').split('?')[0];
    if (!raw.includes('/api/')) {
      next();
      return;
    }
    const isPublic = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/wechat',
    ].some((path) => raw.includes(path));
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const userId = token ? await this.authService.resolveToken(token) : null;

    if (isPublic) {
      next();
      return;
    }
    if (!userId) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: '登录状态已失效，请重新登录',
        },
      });
      return;
    }
    const context = (req.userContext ?? {}) as Record<string, unknown>;
    context.userId = userId;
    // 平台 UserContextMiddleware 会整体替换 req.userContext，这里锁定属性，
    // 让后续赋值只合并字段、不改动我们的 userId。
    Object.defineProperty(req, 'userContext', {
      configurable: true,
      enumerable: true,
      get: () => context,
      set: (value: Record<string, unknown> | undefined) => {
        Object.assign(context, value ?? {});
        context.userId = userId;
      },
    });
    next();
  }
}
