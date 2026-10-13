import { Global, Module } from '@nestjs/common';
import { DRIZZLE_DATABASE, createDatabase } from '@server/common/drizzle';

/** 全局数据库模块：提供 DRIZZLE_DATABASE，业务模块直接注入即可 */
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: () => createDatabase(),
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DatabaseModule {}
