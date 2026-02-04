/**
 * Application error type.
 *
 * Use `AppError` for expected/handled failures (validation, not found, conflict).
 * Anything else will be treated as an internal error (500) by `errorHandler`.
 *
 * @example
 * throw new AppError('Not found', 404, 'NOT_FOUND')
 *
 * @example
 * throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', { errors: [...] })
 */
export default class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
