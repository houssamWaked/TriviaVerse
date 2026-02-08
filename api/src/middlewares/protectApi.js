/**
 * API protection gate.
 *
 * Mount at `/api` to require auth for all API routes except:
 * - `/api/public/*`
 * - `/api/auth/*`
 *
 * This keeps the "public vs protected" split centralized in one place.
 */

export function createProtectApi({ requireAuth }) {
  if (typeof requireAuth !== 'function') {
    throw new TypeError('createProtectApi requires { requireAuth } function');
  }

  return function protectApi(req, res, next) {
    const path = String(req.path || '/');

    const isPublic =
      path === '/public' ||
      path.startsWith('/public/') ||
      path === '/auth' ||
      path.startsWith('/auth/');

    if (isPublic || path === '/') return next();
    return requireAuth(req, res, next);
  };
}

