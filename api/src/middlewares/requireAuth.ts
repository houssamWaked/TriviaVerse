/**
 * Require a valid `Authorization: Bearer <token>` header.
 */
import type { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { supabase } from '../config/supabase.js';

type UserRow = {
  id?: string;
  is_banned?: boolean;
  banned_reason?: string | null;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new AppError('Missing Bearer token', 401, 'UNAUTHORIZED'));
  }

  const decoded = verifyAccessToken(token);
  const userId = decoded.sub;
  const isTest = process.env.NODE_ENV === 'test';
  const isProd = process.env.NODE_ENV === 'production';

  if (isTest) {
    req.user = { id: userId };
    return next();
  }

  const run = async () => {
    const { data, error } = (await supabase
      .from('users')
      .select('id, is_banned, banned_reason')
      .eq('id', userId)
      .limit(1)) as {
      data: UserRow[] | null;
      error: { code?: string; message?: string } | null;
    };

      if (error) {
        const code = String(error.code || '').trim();
        if (code === '42703') {
          req.user = { id: userId };
          next();
          return;
        }
        next(new AppError(error.message || 'Database error', 500, 'DB_ERROR'));
        return;
      }

      const row = data?.[0];
      if (!row?.id) {
        if (isProd) {
          next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
          return;
        }
        req.user = { id: userId };
        next();
        return;
      }
      if (row.is_banned) {
        next(
          new AppError('Account banned', 403, 'BANNED', {
            reason: row.banned_reason || undefined,
          })
        );
        return;
      }

      req.user = { id: userId };
      next();
    };

  void run().catch(() => next(new AppError('Database error', 500, 'DB_ERROR')));
}
