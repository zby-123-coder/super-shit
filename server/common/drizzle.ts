/**
 * 自持数据库接入（替代平台 @lark-apaas/fullstack-nestjs-core）。
 *
 * 业务代码无需改动：这里重新导出与平台同名的 DRIZZLE_DATABASE token
 * 与 PostgresJsDatabase 类型，各 service 的 import 路径已批量指向本文件。
 *
 * 连接来源：DATABASE_URL（优先）或 SUDA_DATABASE_URL（兼容旧配置），
 * 例：DATABASE_URL="postgres://user:pass@127.0.0.1:5432/jiajiao"
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@server/database/schema';

export const DRIZZLE_DATABASE = 'DRIZZLE_DATABASE';

export type PostgresJsDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function createDatabase(): PostgresJsDatabase {
  const url = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;
  if (!url) {
    throw new Error('缺少数据库连接：请设置环境变量 DATABASE_URL');
  }
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}
