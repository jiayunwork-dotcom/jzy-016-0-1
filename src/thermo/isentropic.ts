/**
 * 等熵关系与理想闭式。
 * 对定比热理想气体，等熵过程 T·p^((1−κ)/κ) = 常数。
 */

/** 等熵温度比：T2s/T1 = π^((κ−1)/κ) */
export function isentropicTemperatureRatio(pressureRatio: number, kappa: number): number {
  return Math.pow(pressureRatio, (kappa - 1) / kappa);
}

/**
 * 理想布雷顿循环热效率闭式：η = 1 − π^((1−κ)/κ)。
 * 只取决于压比与比热比，与涡轮入口温度无关。
 */
export function idealThermalEfficiency(pressureRatio: number, kappa: number): number {
  return 1 - Math.pow(pressureRatio, (1 - kappa) / kappa);
}
