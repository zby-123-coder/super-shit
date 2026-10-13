/**
 * 文件存储抽象层。
 *
 * 业务代码只依赖 StorageService，不关心文件在本地磁盘还是对象存储。
 * 切换方式：配置 OSS_BUCKET / OSS_ACCESS_KEY_ID / OSS_SECRET_ACCESS_KEY /
 * OSS_ENDPOINT 即启用 S3 兼容存储（阿里云 OSS / 腾讯 COS / Cloudflare R2 / MinIO），
 * 未配置时零成本使用本地磁盘（默认）。
 */

export interface SaveResult {
  /** 统一返回可访问 URL：本地为 /api/upload/file/<name>，OSS 为公开地址 */
  url: string;
  /** 存储内的对象名（删除/迁移用） */
  key: string;
}

export interface StorageProvider {
  readonly name: string;

  /** 保存文件，返回可访问 URL */
  save(filename: string, content: Buffer, mimetype: string): Promise<SaveResult>;

  /** 读取文件内容（本地实现用于代理路由；OSS 公开读时用不到） */
  get(filename: string): Promise<{ content: Buffer; mimetype: string } | null>;
}
