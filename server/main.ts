import { config } from 'dotenv';

// 加载 .env.local（本地）与 .env（部署）；环境变量优先，不覆盖已有值
config({ path: ['.env.local', '.env'] });
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

/**
 * 标准 Nest 启动（不依赖妙搭平台）。
 * 配置来源：.env.local / 环境变量，关键项：
 *   DATABASE_URL     数据库连接（必填）
 *   PORT             服务端口（默认 3000）
 *   CLIENT_BASE_PATH 前端构建时的 API 前缀（同源部署用 '/'）
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // DTO 校验：剥离子弹字段 + 自动类型转换（@Type(() => Number) 等）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: true,
    }),
  );

  // 前后端分离部署时允许跨域（同源部署无副作用）
  app.enableCors();

  // 前端构建产物由本服务直接提供，单端口部署
  app.useStaticAssets(join(process.cwd(), 'dist/client'), { index: false });

  const port = Number(process.env.PORT || process.env.SERVER_PORT || 3000);
  const host = process.env.SERVER_HOST || '0.0.0.0';
  await app.listen(port, host);
  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://${host}:${port}`);
  logger.log('API endpoints ready at /api');
}

bootstrap();
