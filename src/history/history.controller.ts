import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
} from '@nestjs/common';
import { CalculationType } from './calculation-record.entity';
import { HISTORY_STORE, HistoryPage, HistoryStore } from './history-store';

const VALID_TYPES: ReadonlySet<string> = new Set([
  'ideal',
  'actual',
  'scan',
  'batch_item',
]);

/** 历史查询：按类型 / 批次号过滤，分页返回 */
@Controller('history')
export class HistoryController {
  constructor(
    @Inject(HISTORY_STORE) private readonly store: HistoryStore,
  ) {}

  @Get()
  async list(
    @Query('type') type?: string,
    @Query('batchId') batchId?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ): Promise<HistoryPage> {
    if (type !== undefined && !VALID_TYPES.has(type)) {
      throw new BadRequestException(
        `type 必须是 ${[...VALID_TYPES].join(' / ')} 之一`,
      );
    }
    const limit = clampInt(limitRaw, 50, 1, 500, 'limit');
    const offset = clampInt(offsetRaw, 0, 0, 1_000_000, 'offset');
    return this.store.query({
      type: type as CalculationType | undefined,
      batchId,
      limit,
      offset,
    });
  }
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  name: string,
): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new BadRequestException(`${name} 必须是 ${min} 到 ${max} 的整数`);
  }
  return n;
}
