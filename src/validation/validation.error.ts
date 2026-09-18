export interface ValidationIssue {
  parameter: string;
  message: string;
}

/**
 * 输入校验失败。HTTP 层统一映射为 400，
 * 批量核算时映射为该组工况的失败项（不影响其余组）。
 */
export class InputValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(issues.map((i) => `${i.parameter}: ${i.message}`).join('; '));
    this.name = 'InputValidationError';
    this.issues = issues;
  }
}
