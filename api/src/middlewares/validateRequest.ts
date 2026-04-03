/**
 * Request validation middleware.
 */
import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

type ValidationErrorItem = {
  field: string;
  message: string;
};

export function validateRequest(req: Request, _res: Response, next: NextFunction) {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const errors: ValidationErrorItem[] = result.array().map((entry) => ({
    field: entry.type === 'field' ? entry.path : '_error',
    message: String(entry.msg),
  }));

  return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', { errors }));
}
