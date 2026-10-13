import { Injectable, Logger } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { OssStorageProvider } from './oss-storage.provider';
import type { SaveResult, StorageProvider } from './storage.types';

/**
 * 存储门面：配齐 OSS_* 走对象存储，否则本地磁盘。
 * 上传失败直接抛错（不像 AI 可降级——文件丢失比报错更糟）。
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;

  constructor() {
    const endpoint = process.env.OSS_ENDPOINT ?? '';
    const bucket = process.env.OSS_BUCKET ?? '';
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID ?? '';
    const secretAccessKey = process.env.OSS_SECRET_ACCESS_KEY ?? '';
    if (endpoint && bucket && accessKeyId && secretAccessKey) {
      this.provider = new OssStorageProvider({
        endpoint,
        region: process.env.OSS_REGION || 'auto',
        bucket,
        accessKeyId,
        secretAccessKey,
        publicBaseUrl: process.env.OSS_PUBLIC_BASE_URL,
      });
      this.logger.log(`存储提供方：oss（${bucket}）`);
    } else {
      this.provider = new LocalStorageProvider();
      this.logger.log('存储提供方：local（未配置 OSS_*，使用本地磁盘）');
    }
  }

  get providerName(): string {
    return this.provider.name;
  }

  save(filename: string, content: Buffer, mimetype: string): Promise<SaveResult> {
    return this.provider.save(filename, content, mimetype);
  }

  get(filename: string): Promise<{ content: Buffer; mimetype: string } | null> {
    return this.provider.get(filename);
  }
}
