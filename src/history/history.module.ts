import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationRecord } from './calculation-record.entity';
import { HistoryController } from './history.controller';
import { HISTORY_STORE } from './history-store';
import { InMemoryHistoryStore } from './in-memory-history-store';
import { TypeOrmHistoryStore } from './typeorm-history-store';

/**
 * 历史模块（全局）。两种装配方式：
 *  - withTypeOrm()：生产路径，PostgreSQL 16 持久化；
 *  - inMemory()：测试路径，进程内存储，无需数据库。
 */
@Module({})
export class HistoryModule {
  static withTypeOrm(): DynamicModule {
    return {
      module: HistoryModule,
      global: true,
      imports: [TypeOrmModule.forFeature([CalculationRecord])],
      controllers: [HistoryController],
      providers: [{ provide: HISTORY_STORE, useClass: TypeOrmHistoryStore }],
      exports: [HISTORY_STORE],
    };
  }

  static inMemory(): DynamicModule {
    return {
      module: HistoryModule,
      global: true,
      controllers: [HistoryController],
      providers: [{ provide: HISTORY_STORE, useClass: InMemoryHistoryStore }],
      exports: [HISTORY_STORE],
    };
  }
}
