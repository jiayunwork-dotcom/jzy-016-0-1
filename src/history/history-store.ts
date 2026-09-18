import { CalculationType } from './calculation-record.entity';

/** 依赖注入令牌：生产环境绑定 PostgreSQL 实现，测试绑定内存实现 */
export const HISTORY_STORE = Symbol('HISTORY_STORE');

export interface HistoryRecord {
  id: string;
  type: CalculationType;
  batchId: string | null;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  createdAt: string;
}

export interface NewHistoryRecord {
  type: CalculationType;
  batchId?: string | null;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface HistoryFilter {
  type?: CalculationType;
  batchId?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryPage {
  total: number;
  items: HistoryRecord[];
}

/**
 * 历史存储端口。实现必须保证并发写入互不串扰：
 * 每条记录自带唯一 id，读写不加应用层共享状态。
 */
export interface HistoryStore {
  save(entry: NewHistoryRecord): Promise<HistoryRecord>;
  query(filter: HistoryFilter): Promise<HistoryPage>;
  ping(): Promise<boolean>;
}
