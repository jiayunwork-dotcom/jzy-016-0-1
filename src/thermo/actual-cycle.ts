import { createGas } from './gas';
import { idealThermalEfficiency, isentropicTemperatureRatio } from './isentropic';
import { CycleComputation, ResolvedCycleInput } from './types';

/**
 * 布雷顿循环四点核算（压缩 → 定压加热 → 膨胀 → 排气）。
 *
 * 压缩段：等熵终点 T2s = T1·π^((κ−1)/κ)，计入压气机效率后实际温升更高，
 *         T2 = T1 + (T2s − T1)/ηc；ηc = 1 时与等熵终点重合。
 * 加热段：定压过程，qin = cp·(T3 − T2)。
 * 膨胀段：等熵出口 T4s = T3·π^((1−κ)/κ)，实际出口 T4 = T3 − ηt·(T3 − T4s)，
 *         ηt < 1 时实际出口温度高于等熵出口；排气压力回到进气压力。
 * 净功与效率：wn = wt − wc；η = wn/qin，qin ≤ 0 时 η 为 null。
 */
export function computeCycle(input: ResolvedCycleInput): CycleComputation {
  const gas = createGas(input.kappa, input.gasConstant);
  const p1 = input.inletPressure;
  const p2 = p1 * input.pressureRatio;
  const t1 = input.inletTemperature;
  const t3 = input.turbineInletTemperature;
  const tau = isentropicTemperatureRatio(input.pressureRatio, input.kappa);

  // 1→2 压缩：等熵终点 + 效率修正
  const t2s = t1 * tau;
  const t2 = t1 + (t2s - t1) / input.compressorEfficiency;
  const compressorWork = gas.cp * (t2 - t1);

  // 2→3 定压加热
  const heatInput = gas.cp * (t3 - t2);

  // 3→4 膨胀：等熵焓降 × 涡轮效率；排气压力回到 p1
  const t4s = t3 / tau;
  const t4 = t3 - input.turbineEfficiency * (t3 - t4s);
  const turbineWork = gas.cp * (t3 - t4);

  const netWork = turbineWork - compressorWork;

  // qin ≤ 0 时不得靠除零编造假效率。
  // 两侧效率都为 1 时，wn/qin 在数学上恒等于理想闭式 1 − π^((1−κ)/κ)，
  // 直接取闭式精确值，避免浮点噪声（此时效率与 T3 严格无关）。
  const thermalEfficiency =
    heatInput > 0
      ? input.compressorEfficiency === 1 && input.turbineEfficiency === 1
        ? idealThermalEfficiency(input.pressureRatio, input.kappa)
        : netWork / heatInput
      : null;

  // 材料温度上限：只显式标注「受入口温度限制」，绝不悄悄截断
  const temperatureLimited =
    input.turbineInletTempMax !== null && t3 > input.turbineInletTempMax;
  const limitNote = temperatureLimited
    ? `受入口温度限制：涡轮入口温度 ${t3} K 超过材料上限 ${input.turbineInletTempMax} K，` +
      `结果按给定温度计算、未做截断`
    : null;

  return {
    gas,
    states: [
      { point: 1, name: 'inlet', pressure: p1, temperature: t1 },
      { point: 2, name: 'compressorExit', pressure: p2, temperature: t2 },
      { point: 3, name: 'turbineInlet', pressure: p2, temperature: t3 },
      { point: 4, name: 'exhaust', pressure: p1, temperature: t4 },
    ],
    compressorWork,
    turbineWork,
    netWork,
    heatInput,
    thermalEfficiency,
    temperatureLimited,
    limitNote,
  };
}
