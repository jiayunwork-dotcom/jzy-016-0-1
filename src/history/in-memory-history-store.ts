import { randomUUID } from 'crypto';
import {
  HistoryFilter,
  HistoryPage,
  HistoryRecord,
  HistoryStore,
  NewHistoryRecord,
} from './history-store';

/**
 * 内存实现：仅用于自动化测试与本地无库调试。
 * 生产环境一律走 PostgreSQL（TypeOrmHistoryStore）。
 */
export class InMemoryHistoryStore implements HistoryStore {
  private readonly records: HistoryRecord[] = [];

  async save(entry: NewHistoryRecord): Promise<HistoryRecord> {
    const record: HistoryRecord = {
      id: randomUUID(),
      type: entry.type,
      batchId: entry.batchId ?? null,
      request: entry.request,
      response: entry.response,
      createdAt: new Date().toISOString(),
    };
    this.records.push(record);
    return record;
  }

  async query(filter: HistoryFilter): Promise<HistoryPage> {
    let items = this.records;
    if (filter.type) items = items.filter((r) => r.type === filter.type);
    if (filter.batchId) items = items.filter((r) => r.batchId === filter.batchId);
    const total = items.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 50;
    return { total, items: items.slice(offset, offset + limit) };
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
