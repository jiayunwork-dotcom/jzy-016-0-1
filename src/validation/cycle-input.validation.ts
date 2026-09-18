import { DEFAULTS } from '../config/defaults';
import { ResolvedCycleInput } from '../thermo/types';
import { InputValidationError, ValidationIssue } from './validation.error';

/** 部件效率字段的处理方式：理想路径忽略 / 实际路径必填 / 批量路径缺省为 1 */
export type EfficiencyMode = 'ignored' | 'required' | 'default-ideal';

type Body = Record<string, unknown>;

function isPlainObject(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 读取必填的有限数值字段 */
function readFiniteNumber(
  body: Body,
  parameter: string,
  issues: ValidationIssue[],
): number | null {
  const v = body[parameter];
  if (v === undefined || v === null) {
    issues.push({ parameter, message: '缺少必填参数' });
    return null;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    issues.push({ parameter, message: '必须是有限数值' });
    return null;
  }
  return v;
}

/** 读取可选的有限数值字段；未提供时返回 fallback */
function readOptionalNumber(
  body: Body,
  parameter: string,
  fallback: number | null,
  issues: ValidationIssue[],
): number | null {
  const v = body[parameter];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    issues.push({ parameter, message: '必须是有限数值' });
    return null;
  }
  return v;
}

function readEfficiency(
  body: Body,
  parameter: string,
  mode: EfficiencyMode,
  issues: ValidationIssue[],
): number | null {
  if (mode === 'ignored') return 1;
  const v = body[parameter];
  if (v === undefined || v === null) {
    if (mode === 'required') {
      issues.push({ parameter, message: '缺少必填参数' });
      return null;
    }
    return 1; // default-ideal
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    issues.push({ parameter, message: '必须是有限数值' });
    return null;
  }
  if (v <= 0 || v > 1) {
    issues.push({ parameter, message: '等熵效率必须落在 (0, 1]' });
    return null;
  }
  return v;
}

/**
 * 校验单组循环工况并解析默认值。
 * 任一参数非法都汇总到 issues，一次性抛出 InputValidationError。
 */
export function validateCycleInput(
  raw: unknown,
  efficiencyMode: EfficiencyMode,
): ResolvedCycleInput {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(raw)) {
    throw new InputValidationError([
      { parameter: '(body)', message: '请求体必须是 JSON 对象' },
    ]);
  }
  const body = raw;

  const pressureRatio = readFiniteNumber(body, 'pressureRatio', issues);
  if (pressureRatio !== null && pressureRatio <= 1) {
    issues.push({ parameter: 'pressureRatio', message: '压比必须严格大于 1' });
  }

  const inletTemperature = readFiniteNumber(body, 'inletTemperature', issues);
  if (inletTemperature !== null && inletTemperature <= 0) {
    issues.push({
      parameter: 'inletTemperature',
      message: '进气热力学温度必须为正',
    });
  }

  const turbineInletTemperature = readFiniteNumber(
    body,
    'turbineInletTemperature',
    issues,
  );
  if (
    turbineInletTemperature !== null &&
    inletTemperature !== null &&
    turbineInletTemperature < inletTemperature
  ) {
    issues.push({
      parameter: 'turbineInletTemperature',
      message: '涡轮入口温度不得低于进气温度',
    });
  }

  const kappa = readFiniteNumber(body, 'kappa', issues);
  if (kappa !== null && kappa <= 1) {
    issues.push({ parameter: 'kappa', message: '比热比必须大于 1' });
  }

  const compressorEfficiency = readEfficiency(
    body,
    'compressorEfficiency',
    efficiencyMode,
    issues,
  );
  const turbineEfficiency = readEfficiency(
    body,
    'turbineEfficiency',
    efficiencyMode,
    issues,
  );

  const gasConstant = readOptionalNumber(
    body,
    'gasConstant',
    DEFAULTS.gasConstant,
    issues,
  );
  if (gasConstant !== null && gasConstant <= 0) {
    issues.push({ parameter: 'gasConstant', message: '气体常数必须为正' });
  }

  const inletPressure = readOptionalNumber(
    body,
    'inletPressure',
    DEFAULTS.inletPressure,
    issues,
  );
  if (inletPressure !== null && inletPressure <= 0) {
    issues.push({ parameter: 'inletPressure', message: '进气压力必须为正' });
  }

  const turbineInletTempMax = readOptionalNumber(
    body,
    'turbineInletTempMax',
    null,
    issues,
  );
  if (turbineInletTempMax !== null && turbineInletTempMax <= 0) {
    issues.push({
      parameter: 'turbineInletTempMax',
      message: '材料温度上限必须为正',
    });
  }

  if (issues.length > 0) throw new InputValidationError(issues);

  return {
    pressureRatio: pressureRatio as number,
    inletTemperature: inletTemperature as number,
    turbineInletTemperature: turbineInletTemperature as number,
    compressorEfficiency: compressorEfficiency as number,
    turbineEfficiency: turbineEfficiency as number,
    kappa: kappa as number,
    gasConstant: gasConstant as number,
    inletPressure: inletPressure as number,
    turbineInletTempMax,
  };
}

export interface ResolvedScanInput {
  base: Omit<ResolvedCycleInput, 'pressureRatio'>;
  pressureRatioMin: number;
  pressureRatioMax: number;
  points: number;
}

/** 校验压比扫描请求：循环参数（不含压比）+ 扫描区间与取点数 */
export function validateScanInput(raw: unknown): ResolvedScanInput {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(raw)) {
    throw new InputValidationError([
      { parameter: '(body)', message: '请求体必须是 JSON 对象' },
    ]);
  }

  // 复用单点校验：补一个恒合法的占位压比，扫描区间在下面单独校验，
  // 这样区间取值非法时报错能指到 pressureRatioMin/Max 而不是占位参数
  const probe = validateCycleInput({ ...raw, pressureRatio: 2 }, 'required');

  const pressureRatioMin = readOptionalNumber(
    raw,
    'pressureRatioMin',
    DEFAULTS.scan.pressureRatioMin,
    issues,
  );
  if (pressureRatioMin !== null && pressureRatioMin <= 1) {
    issues.push({
      parameter: 'pressureRatioMin',
      message: '扫描下界必须严格大于 1',
    });
  }

  const pressureRatioMax = readOptionalNumber(
    raw,
    'pressureRatioMax',
    DEFAULTS.scan.pressureRatioMax,
    issues,
  );
  if (
    pressureRatioMin !== null &&
    pressureRatioMax !== null &&
    pressureRatioMax <= pressureRatioMin
  ) {
    issues.push({
      parameter: 'pressureRatioMax',
      message: '扫描上界必须大于下界',
    });
  }

  const pointsRaw = readOptionalNumber(
    raw,
    'points',
    DEFAULTS.scan.points,
    issues,
  );
  if (
    pointsRaw !== null &&
    (!Number.isInteger(pointsRaw) || pointsRaw < 2 || pointsRaw > 2000)
  ) {
    issues.push({
      parameter: 'points',
      message: '取点数必须是 2 到 2000 的整数',
    });
  }

  if (issues.length > 0) throw new InputValidationError(issues);

  const { pressureRatio: _ignored, ...base } = probe;
  return {
    base,
    pressureRatioMin: pressureRatioMin as number,
    pressureRatioMax: pressureRatioMax as number,
    points: pointsRaw as number,
  };
}

/** 校验批量核算请求体，返回工况数组（逐组校验在调用方进行） */
export function validateBatchBody(raw: unknown): unknown[] {
  if (!isPlainObject(raw) || !Array.isArray(raw.cases)) {
    throw new InputValidationError([
      { parameter: 'cases', message: '请求体必须包含 cases 数组' },
    ]);
  }
  if (raw.cases.length === 0) {
    throw new InputValidationError([
      { parameter: 'cases', message: 'cases 数组不能为空' },
    ]);
  }
  if (raw.cases.length > 500) {
    throw new InputValidationError([
      { parameter: 'cases', message: '单次批量最多 500 组工况' },
    ]);
  }
  return raw.cases;
}
