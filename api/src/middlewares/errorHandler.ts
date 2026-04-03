import type { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError.js';

type ErrorPayload = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  errors?: unknown;
  stack?: string;
};

type ErrorLike = Error & {
  code?: string;
  details?: { errors?: unknown } | unknown;
  statusCode?: number;
};

/**
 * Global error handler.
 */
export function errorHandler(
  err: ErrorLike,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(err);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && statusCode >= 500) {
    console.error('[error]', {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      code: err?.code || 'INTERNAL_ERROR',
      message: err?.message || 'Unknown error',
    });
    if (err?.stack) {
      console.error(err.stack);
    }
  }

  const payload: ErrorPayload = {
    success: false,
    message: err.message || 'Something went wrong',
    code: err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
  };

  if (err instanceof AppError && err.details !== undefined) {
    payload.details = err.details;
    const details = err.details as { errors?: unknown } | undefined;
    if (Array.isArray(details?.errors)) {
      payload.errors = details.errors;
    }
  }

  if (!isProd) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
}
