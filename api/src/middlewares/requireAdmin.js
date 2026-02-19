/**
 * Require a valid Bearer token AND that the user is an admin.
 *
 * Admin users are determined by the email(s) in:
 * - `ADMIN_EMAILS` (comma-separated)
 * - or `ADMIN_EMAIL`
 *
 * Relies on JWT containing `email` (see `signAccessToken`).
 */
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

function getAdminEmailSet() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  const list = String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(list);
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new AppError('Missing Bearer token', 401, 'UNAUTHORIZED'));
  }

  const decoded = verifyAccessToken(token);
  const email = String(decoded.email || '')
    .trim()
    .toLowerCase();
  const admins = getAdminEmailSet();

  if (admins.size === 0) {
    return next(new AppError('Admin access is not configured', 501, 'NOT_CONFIGURED'));
  }

  if (!email || !admins.has(email)) {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }

  req.user = { id: decoded.sub, email: decoded.email, username: decoded.username };
  return next();
}
