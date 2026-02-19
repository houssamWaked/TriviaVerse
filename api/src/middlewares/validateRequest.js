/**
 * Request validation middleware.
 *
 * Reads the results produced by express-validator chains and converts them into
 * a single `AppError` so error responses are consistent across the API.
 *
 * Error format:
 * - `code`: `VALIDATION_ERROR`
 * - `errors`: array of `{ field, message }`
 */
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', { errors }));
}
