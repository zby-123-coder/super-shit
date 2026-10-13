import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import type { SaveResult, StorageProvider } from './storage.types';

/**
 * S3 兼容对象存储（阿里云 OSS / 腾讯 COS / Cloudflare R2 / MinIO）。
 *
 * 启用方式（.env.local 或部署环境变量）：
 *   OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com   # 或 cos.ap-guangzhou.myqcloud.com
 *   OSS_REGION=oss-cn-hangzhou
 *   OSS_BUCKET=your-bucket
 *   OSS_ACCESS_KEY_ID=xxx
 *   OSS_SECRET_ACCESS_KEY=xxx
 *   OSS_PUBLIC_BASE_URL=https://cdn.example.com         # 可选：公开读前缀
 */
export class OssStorageProvider implements StorageProvider {
  readonly name = 'oss';
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBaseUrl?: string;
  }) {
    this.bucket = config.bucket;
    this.publicBaseUrl = config.publicBaseUrl ?? '';
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async save(filename: string, content: Buffer, mimetype: string): Promise<SaveResult> {
    const key = `jiajiao/${filename}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: mimetype,
      }),
    );
    const url = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : `/api/upload/file/${filename}`;
    return { url, key };
  }

  async get(filename: string): Promise<{ content: Buffer; mimetype: string } | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: `jiajiao/${filename}` }),
      );
      const body = await result.Body?.transformToByteArray();
      if (!body) return null;
      return {
        content: Buffer.from(body),
        mimetype: result.ContentType ?? 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
}
