import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import { StorageService } from '@server/common/storage/storage.service';

const MAX_SIZE = 5 * 1024 * 1024;

@Controller('api/upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 通用图片上传（打卡图片等）。
   * 存储后端由 StorageService 决定：本地磁盘或 S3 兼容 OSS（配置 OSS_* 即切换）。
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
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
  async uploadImage(@UploadedFile() file: { originalname: string; buffer: Buffer; mimetype: string }) {
    if (!file) {
      return { url: '' };
    }
    const ext = extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}_${randomBytes(6).toString('hex')}${ext}`;
    const result = await this.storageService.save(filename, file.buffer, file.mimetype);
    return { url: result.url };
  }

  /** 读取已上传文件（本地存储时走此代理路由；OSS 公开读时直接访问 OSS URL） */
  @Get('file/:name')
  async getFile(
    @Param('name') name: string,
    @Res() res: {
      send: (body: Buffer) => void;
      type: (mime: string) => void;
      status: (code: number) => { send: (body: string) => void };
    },
  ): Promise<void> {
    const result = await this.storageService.get(name);
    if (!result) {
      res.status(404).send('Not Found');
      return;
    }
    res.type(result.mimetype);
    res.send(result.content);
  }
}
