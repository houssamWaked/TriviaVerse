/**
 * Application error type.
 *
 * Use `AppError` for expected/handled failures (validation, not found, conflict).
 * Anything else will be treated as an internal error (500) by `errorHandler`.
 */
export default class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
