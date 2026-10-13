import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_SIZE = 5 * 1024 * 1024;

@Controller('api/upload')
export class UploadController {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  /**
   * 通用图片上传（打卡图片等）。
   * 本地开发落盘到 uploads/；部署时把这里换成 OSS/COS 的 SDK 即可，
   * 返回结构保持 { url } 不变，前端零改动。
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          const ext = extname(file.originalname) || '.jpg';
          const name = `${Date.now()}_${randomBytes(6).toString('hex')}${ext}`;
          callback(null, name);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!/^image\//.test(file.mimetype)) {
          callback(new Error('仅支持图片文件'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: { originalname: string; filename: string; mimetype: string }) {
    if (!file) {
      return { url: '' };
    }
    return { url: `/api/upload/file/${file.filename}` };
  }

  /** 读取已上传图片（带 token 访问） */
  @Get('file/:name')
  getFile(
    @Param('name') name: string,
    @Res() res: { sendFile: (path: string) => void },
  ) {
    const safe = name.replace(/[^\w.-]/g, '');
    res.sendFile(join(UPLOAD_DIR, safe));
  }
}
