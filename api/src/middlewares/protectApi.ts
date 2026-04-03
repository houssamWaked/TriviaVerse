/**
 * API protection gate.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

type RequireAuthMiddleware = (req: Request, res: Response, next: NextFunction) => unknown;

export function createProtectApi({
  requireAuth,
}: {
  requireAuth: RequireAuthMiddleware;
}): RequestHandler {
  if (typeof requireAuth !== 'function') {
    throw new TypeError('createProtectApi requires { requireAuth } function');
  }

  return function protectApi(req, res, next) {
    const path = String(req.path || '/');

    const isPublic =
      path === '/public' ||
      path.startsWith('/public/') ||
      path === '/auth' ||
      path.startsWith('/auth/') ||
      path === '/leaderboard' ||
      path.startsWith('/leaderboard/');

    if (isPublic || path === '/') return next();
    return requireAuth(req, res, next);
  };
}
