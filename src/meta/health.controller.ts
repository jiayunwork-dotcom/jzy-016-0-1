import { Controller, Get, Inject } from '@nestjs/common';
import { HISTORY_STORE, HistoryStore } from '../history/history-store';

/** 运行状态端点：供监控采集，含存储探活 */
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HISTORY_STORE) private readonly store: HistoryStore,
  ) {}

  @Get()
  async health() {
    const storeUp = await this.store.ping();
    return {
      status: storeUp ? 'ok' : 'degraded',
      store: storeUp ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime() * 1000) / 1000,
      timestamp: new Date().toISOString(),
    };
  }
}
