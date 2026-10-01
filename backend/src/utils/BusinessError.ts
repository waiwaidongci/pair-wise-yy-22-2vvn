import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * 业务异常：service 与 controller 各自包装后再交给全局错误中间件，
 * 禁止在单一位置吞掉全部异常。
 */
export class BusinessError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ErrorCode, details: Record<string, unknown> = {}, status = 409) {
    const template = ERROR_MESSAGES[code] ?? code;
    const message = template.replace(/\{(\w+)\}/g, (_m, key) =>
      details[key] === undefined ? `{${key}}` : String(details[key])
    );
    super(message);
    this.name = "BusinessError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(code: ErrorCode, details: Record<string, unknown>): BusinessError {
    return new BusinessError(code, details, 404);
  }

  static validation(reason: string): BusinessError {
    return new BusinessError(ERROR_CODES.VALIDATION_FAILED as ErrorCode, { reason }, 400);
  }
}
