/**
 * 404 handler for unknown routes.
 *
 * This should be registered *after* all routers.
 * It forwards a typed `AppError` to the global `errorHandler`.
 */
import AppError from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      'NOT_FOUND'
    )
  );
}
