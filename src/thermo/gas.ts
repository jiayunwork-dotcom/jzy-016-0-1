/**
 * 工质模型：定压比热为常数的理想气体。
 * cp、R、κ 三者必须自洽：cp = κ·R/(κ−1)。
 * 比热比一变，同一温差对应的焓变随之改变——cp 绝不写成与 κ 脱钩的死数。
 */
export interface GasModel {
  /** 比热比 κ = cp/cv > 1 */
  kappa: number;
  /** 气体常数 R，J/(kg·K) */
  r: number;
  /** 定压比热 cp，J/(kg·K)，由 κ 与 R 自洽导出 */
  cp: number;
}

export function createGas(kappa: number, r: number): GasModel {
  const cp = (kappa * r) / (kappa - 1);
  return { kappa, r, cp };
}
