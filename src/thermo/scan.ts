import { computeCycle } from './actual-cycle';
import { ResolvedCycleInput } from './types';

export interface ScanPoint {
  pressureRatio: number;
  netWork: number;
  thermalEfficiency: number | null;
}

export interface ScanResult {
  points: ScanPoint[];
  /** 比净功最高的压比点 */
  best: ScanPoint;
}

/**
 * 压比区间扫描：在钉死的进气温度与涡轮入口温度下，逐点核算比净功与热效率。
 *
 * 关键物理事实：计入部件效率后，比净功随压比先升后降，存在内点最优压比；
 * 扫描结果必须能看出这个拐点，绝不能沿用理想效率式宣称压比越大越好。
 */
export function scanPressureRatio(
  base: Omit<ResolvedCycleInput, 'pressureRatio'>,
  pressureRatioMin: number,
  pressureRatioMax: number,
  points: number,
): ScanResult {
  const samples: ScanPoint[] = [];
  for (let i = 0; i < points; i++) {
    const pr =
      points === 1
        ? pressureRatioMin
        : pressureRatioMin +
          ((pressureRatioMax - pressureRatioMin) * i) / (points - 1);
    const r = computeCycle({ ...base, pressureRatio: pr });
    samples.push({
      pressureRatio: pr,
      netWork: r.netWork,
      thermalEfficiency: r.thermalEfficiency,
    });
  }
  let best = samples[0];
  for (const p of samples) {
    if (p.netWork > best.netWork) best = p;
  }
  return { points: samples, best };
}
