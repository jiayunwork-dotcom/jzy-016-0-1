import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DEMO_CASE } from '../config/defaults';
import { computeCycle } from '../thermo/actual-cycle';
import { idealThermalEfficiency } from '../thermo/isentropic';
import { scanPressureRatio } from '../thermo/scan';
import { CycleComputation, ResolvedCycleInput } from '../thermo/types';
import {
  validateBatchBody,
  validateCycleInput,
  validateScanInput,
} from '../validation/cycle-input.validation';
import { InputValidationError } from '../validation/validation.error';
import { HISTORY_STORE, HistoryStore } from '../history/history-store';

export interface CycleResponse extends CycleComputation {
  input: ResolvedCycleInput;
  recordId: string;
}

export interface BatchItemResult {
  index: number;
  ok: boolean;
  result?: CycleResponse;
  error?: { issues: { parameter: string; message: string }[] };
}

/** 核算编排：校验 → 计算 → 持久化 → 返回。无共享可变状态，并发安全。 */
@Injectable()
export class CycleService {
  constructor(
    @Inject(HISTORY_STORE) private readonly store: HistoryStore,
  ) {}

  /** 理想循环：部件效率强制为 1，热效率取闭式精确值 */
  async ideal(raw: unknown): Promise<CycleResponse> {
    const input = validateCycleInput(raw, 'ignored');
    return this.computeAndRecord({ ...input, compressorEfficiency: 1, turbineEfficiency: 1 }, 'ideal');
  }

  /** 实际循环：计入压气机与涡轮等熵效率 */
  async actual(raw: unknown): Promise<CycleResponse> {
    const input = validateCycleInput(raw, 'required');
    return this.computeAndRecord(input, 'actual');
  }

  /** 压比扫描寻优：逐点核算并回报净功最高点 */
  async scan(raw: unknown) {
    const { base, pressureRatioMin, pressureRatioMax, points } =
      validateScanInput(raw);
    const { points: samples, best } = scanPressureRatio(
      base,
      pressureRatioMin,
      pressureRatioMax,
      points,
    );
    const request = {
      ...base,
      pressureRatioMin,
      pressureRatioMax,
      points,
    };
    const response = { input: request, points: samples, best };
    const record = await this.store.save({ type: 'scan', request, response });
    return { ...response, recordId: record.id };
  }

  /**
   * 批量核算：逐组校验、逐组计算。
   * 任一组非法只标记该组（指明第几组、哪个参数），其余组照常返回。
   */
  async batch(raw: unknown): Promise<{ batchId: string; results: BatchItemResult[] }> {
    const cases = validateBatchBody(raw);
    const batchId = randomUUID();
    const results: BatchItemResult[] = [];
    for (let i = 0; i < cases.length; i++) {
      try {
        const input = validateCycleInput(cases[i], 'default-ideal');
        const result = await this.computeAndRecord(input, 'batch_item', batchId);
        results.push({ index: i, ok: true, result });
      } catch (err) {
        if (err instanceof InputValidationError) {
          results.push({
            index: i,
            ok: false,
            error: { issues: err.issues },
          });
        } else {
          throw err;
        }
      }
    }
    return { batchId, results };
  }

  /** 内置示范算例：压比 12、航空改型常用效率量级、典型涡轮入口温度 */
  async demo() {
    const input = validateCycleInput(DEMO_CASE, 'required');
    const result = await this.computeAndRecord(input, 'actual');
    const idealEta = idealThermalEfficiency(input.pressureRatio, input.kappa);
    return {
      ...result,
      idealThermalEfficiencyAtSamePressureRatio: idealEta,
      // 示范算例的两条物理断言：比净功为正、热效率低于同压比理想闭式
      netWorkPositive: result.netWork > 0,
      belowIdealEfficiency:
        result.thermalEfficiency !== null && result.thermalEfficiency < idealEta,
    };
  }

  private async computeAndRecord(
    input: ResolvedCycleInput,
    type: 'ideal' | 'actual' | 'batch_item',
    batchId: string | null = null,
  ): Promise<CycleResponse> {
    const computation = computeCycle(input);
    const request: Record<string, unknown> = { ...input };
    const response: Record<string, unknown> = { input, ...computation };
    const record = await this.store.save({
      type,
      batchId,
      request,
      response,
    });
    return { input, ...computation, recordId: record.id };
  }
}
