import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * SPA fallback：非 /api 路由一律返回 index.html，
 * 由前端路由接管（react-router BrowserRouter）。
 */
@Controller()
export class ViewController {
  @Get(['/', '*'])
  render(@Req() req: Request, @Res() res: Response): void {
    if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/uploads/')) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not Found' } });
      return;
    }
    const indexHtml = join(process.cwd(), 'dist/client/index.html');
    if (!existsSync(indexHtml)) {
      res
        .status(503)
        .send('前端未构建：请先执行 npm run build:client（或本地开发用 npm run dev:client）');
      return;
    }
    res.sendFile(indexHtml);
  }
}
