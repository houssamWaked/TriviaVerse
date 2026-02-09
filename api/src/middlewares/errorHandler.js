/**
 * Global error handler.
 *
 * Produces a consistent JSON error shape:
 * - `success: false`
 * - `message`: human-readable string
 * - `code`: stable machine-readable code
 * - `details` / `errors`: optional structured payload (when provided via AppError)
 *
 * In non-production:
 * - Includes `stack` to aid debugging
 */
import AppError from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) return next(err);

  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Don't leak internals in production
  const isProd = process.env.NODE_ENV === 'production';

  // In production, log 5xx errors server-side so platforms like Railway show
  // the root cause in application logs without leaking internals to clients.
  if (isProd && statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      code: err?.code || 'INTERNAL_ERROR',
      message: err?.message || 'Unknown error',
    });
    if (err?.stack) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    }
  }

  const payload = {
    success: false,
    message: err.message || 'Something went wrong',
    code: err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
  };

  if (err instanceof AppError && err.details !== undefined) {
    payload.details = err.details;
    if (Array.isArray(err.details?.errors)) {
      payload.errors = err.details.errors;
    }
  }

  if (!isProd) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
}
