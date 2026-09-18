/**
 * 全局默认值与容差约定。
 * 通过 GET /api/v1/conventions 对外回显，改动此处即改动对外约定。
 */
export const DEFAULTS = {
  /** 比热比 γ（空气/燃气常用近似） */
  kappa: 1.4,
  /** 气体常数 R，J/(kg·K) */
  gasConstant: 287,
  /** 进气压力 p1，Pa */
  inletPressure: 101325,
  /** 未给部件效率时（批量核算）按理想部件处理 */
  compressorEfficiency: 1,
  turbineEfficiency: 1,
  /** 压比扫描默认区间与取点数 */
  scan: { pressureRatioMin: 2, pressureRatioMax: 60, points: 120 },
  /** 数值容差约定（仅供调用方参考，服务端不据此截断任何结果） */
  tolerances: {
    floatEquality: 1e-9,
    closedFormEfficiency: 1e-12,
  },
} as const;

/**
 * 内置示范算例：压比 12、航空改型常用效率量级、典型涡轮入口温度。
 * 物理事实：比净功为正，且热效率低于同压比理想闭式。
 */
export const DEMO_CASE = {
  pressureRatio: 12,
  inletTemperature: 288.15,
  turbineInletTemperature: 1500,
  compressorEfficiency: 0.85,
  turbineEfficiency: 0.88,
  kappa: 1.4,
} as const;
