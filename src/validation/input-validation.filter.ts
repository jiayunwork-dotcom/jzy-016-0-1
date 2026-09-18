import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InputValidationError } from '../validation/validation.error';

/** 输入校验失败 → 400，逐参数列出问题 */
@Catch(InputValidationError)
export class InputValidationFilter implements ExceptionFilter {
  catch(exception: InputValidationError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'VALIDATION_FAILED',
      issues: exception.issues,
    });
  }
}
