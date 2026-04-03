/**
 * Optional auth middleware.
 */
import type { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header) return next();

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return next(new AppError('Invalid Bearer token', 401, 'UNAUTHORIZED'));
  }

  const decoded = verifyAccessToken(token);
  req.user = { id: decoded.sub };
  return next();
}
