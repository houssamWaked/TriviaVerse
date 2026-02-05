/**
 * Require a valid `Authorization: Bearer <token>` header.
 *
 * On success:
 * - Attaches `req.user = { id }`
 *
 * On failure:
 * - Throws `AppError(401, UNAUTHORIZED)`
 */
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new AppError('Missing Bearer token', 401, 'UNAUTHORIZED'));
  }

  const decoded = verifyAccessToken(token);
  req.user = { id: decoded.sub };
  return next();
}

