import { GasModel } from './gas';

/** 校验通过、默认值已解析的循环输入 */
export interface ResolvedCycleInput {
  /** 压比 π，严格大于 1 */
  pressureRatio: number;
  /** 进气热力学温度 T1，K，严格为正 */
  inletTemperature: number;
  /** 涡轮入口温度 T3，K，不得低于进气温度 */
  turbineInletTemperature: number;
  /** 压气机等熵效率 ηc ∈ (0, 1] */
  compressorEfficiency: number;
  /** 涡轮等熵效率 ηt ∈ (0, 1] */
  turbineEfficiency: number;
  /** 比热比 κ > 1 */
  kappa: number;
  /** 气体常数 R，J/(kg·K) */
  gasConstant: number;
  /** 进气压力 p1，Pa */
  inletPressure: number;
  /** 涡轮入口材料温度上限，K；null 表示未提供。只标注、不截断 */
  turbineInletTempMax: number | null;
}

export interface StatePoint {
  /** 状态点编号：1 进气 / 2 压气机出口 / 3 涡轮入口 / 4 排气 */
  point: 1 | 2 | 3 | 4;
  name: 'inlet' | 'compressorExit' | 'turbineInlet' | 'exhaust';
  pressure: number;
  temperature: number;
}

export interface CycleComputation {
  gas: GasModel;
  states: StatePoint[];
  /** 压气机比功 wc = cp·(T2−T1)，J/kg */
  compressorWork: number;
  /** 涡轮比功 wt = cp·(T3−T4)，J/kg */
  turbineWork: number;
  /** 比净功 wn = wt − wc，J/kg */
  netWork: number;
  /** 加入的比热量 qin = cp·(T3−T2)，J/kg；T3 ≤ T2 时为零或负 */
  heatInput: number;
  /** 热效率 η = wn/qin；qin ≤ 0 时为 null（绝不用除零编造假效率） */
  thermalEfficiency: number | null;
  /** 是否超出材料温度上限（只标注，未截断） */
  temperatureLimited: boolean;
  limitNote: string | null;
}
