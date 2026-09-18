import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculationRecord } from './calculation-record.entity';
import {
  HistoryFilter,
  HistoryPage,
  HistoryRecord,
  HistoryStore,
  NewHistoryRecord,
} from './history-store';

/** PostgreSQL 16 持久化实现（生产路径） */
@Injectable()
export class TypeOrmHistoryStore implements HistoryStore {
  constructor(
    @InjectRepository(CalculationRecord)
    private readonly repo: Repository<CalculationRecord>,
  ) {}

  async save(entry: NewHistoryRecord): Promise<HistoryRecord> {
    const saved = await this.repo.save(
      this.repo.create({
        type: entry.type,
        batchId: entry.batchId ?? null,
        request: entry.request,
        response: entry.response,
      }),
    );
    return toHistoryRecord(saved);
  }

  async query(filter: HistoryFilter): Promise<HistoryPage> {
    const [rows, total] = await this.repo.findAndCount({
      where: {
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.batchId ? { batchId: filter.batchId } : {}),
      },
      order: { createdAt: 'DESC' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
    return { total, items: rows.map(toHistoryRecord) };
  }

  async ping(): Promise<boolean> {
    try {
      await this.repo.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

function toHistoryRecord(row: CalculationRecord): HistoryRecord {
  return {
    id: row.id,
    type: row.type,
    batchId: row.batchId,
    request: row.request,
    response: row.response,
    createdAt: row.createdAt.toISOString(),
  };
}
