import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SaveResult, StorageProvider } from './storage.types';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

/** 本地磁盘存储：默认实现，零配置；重启/多实例会丢，生产建议换 OSS */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';

  private ensureDir(): void {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  async save(filename: string, content: Buffer): Promise<SaveResult> {
    this.ensureDir();
    writeFileSync(join(UPLOAD_DIR, filename), content);
    return { url: `/api/upload/file/${filename}`, key: filename };
  }

  async get(filename: string): Promise<{ content: Buffer; mimetype: string } | null> {
    const safe = filename.replace(/[^\w.-]/g, '');
    const path = join(UPLOAD_DIR, safe);
    if (!existsSync(path)) return null;
    const ext = safe.split('.').pop()?.toLowerCase() ?? '';
    const mimetype =
      ext === 'png'
        ? 'image/png'
        : ext === 'gif'
          ? 'image/gif'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    return { content: readFileSync(path), mimetype };
  }
}
