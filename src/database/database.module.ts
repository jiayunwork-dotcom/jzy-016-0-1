import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationRecord } from '../history/calculation-record.entity';

/**
 * PostgreSQL 16 连接。启动时自动重试，等待数据库就绪
 * （配合 docker-compose 的 healthcheck / depends_on）。
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'brayton',
      password: process.env.DB_PASSWORD ?? 'brayton',
      database: process.env.DB_NAME ?? 'brayton',
      entities: [CalculationRecord],
      synchronize: true, // 试算服务演示用；生产应改为迁移
      retryAttempts: 30,
      retryDelay: 3000,
    }),
  ],
})
export class DatabaseModule {}
