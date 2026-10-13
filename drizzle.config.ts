import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });
import { defineConfig } from 'drizzle-kit';

/**
 * 自持 schema 生成（替代平台的 gen:db-schema）。
 * 用法：npm run gen:db-schema  → introspect 当前数据库到 server/database/schema.ts
 * 注意：生成的 schema.ts 为 auto-generated，勿手改。
 */
export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL || '',
  },
  out: './server/database/migrations',
  schema: './server/database/schema.ts',
});
