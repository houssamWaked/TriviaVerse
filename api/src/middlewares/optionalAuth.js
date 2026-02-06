/**
 * Optional auth middleware.
 *
 * If `Authorization: Bearer <token>` is provided and valid:
 * - Attaches `req.user = { id }`
 *
 * If no header:
 * - Continues without `req.user`
 *
 * If header exists but invalid:
 * - Throws `AppError(401, UNAUTHORIZED)`
 */
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function optionalAuth(req, res, next) {
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

