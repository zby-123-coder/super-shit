import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

const PUBLIC_PATHS = ['/api/auth/register', '/api/auth/login'];

/**
 * 统一鉴权：解析 Bearer token → 写入 req.userContext.userId，让业务代码零改动。
 * 除注册/登录外，所有 /api 请求都必须携带有效会话。
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.baseUrl || req.originalUrl.split('?')[0];
    if (!path.startsWith('/api')) {
      next();
      return;
    }
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const userId = token ? await this.authService.resolveToken(token) : null;

    if (PUBLIC_PATHS.includes(path)) {
      next();
      return;
    }
    if (!userId) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }
    const context = (req.userContext ?? {}) as Record<string, unknown>;
    context.userId = userId;
    req.userContext = context as Request['userContext'];
    next();
  }
}
