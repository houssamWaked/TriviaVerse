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
import { supabase } from '../config/supabase.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new AppError('Missing Bearer token', 401, 'UNAUTHORIZED'));
  }

  const decoded = verifyAccessToken(token);
  const userId = decoded.sub;

  // Enforce bans server-side (tokens issued before a ban should stop working).
  supabase
    .from('users')
    .select('id, is_banned, banned_reason')
    .eq('id', userId)
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        const code = String(error.code || '').trim();
        if (code === '42703') {
          // Older schema without ban columns: allow auth.
          req.user = { id: userId };
          return next();
        }
        return next(new AppError(error.message || 'Database error', 500, 'DB_ERROR'));
      }

      const row = data?.[0];
      if (!row?.id) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      if (row.is_banned) {
        return next(
          new AppError('Account banned', 403, 'BANNED', {
            reason: row.banned_reason || undefined,
          })
        );
      }

      req.user = { id: userId };
      return next();
    })
    .catch(() => next(new AppError('Database error', 500, 'DB_ERROR')));
}
