/**
 * Auth controller.
 */
import type { CookieOptions, Request, Response } from 'express';
import AppError from '../utils/AppError.js';
import { signRefreshToken } from '../utils/jwt.js';

type AuthUser = {
  id: string;
  email?: string;
  username?: string;
};

type AuthResult = {
  token?: string;
  user: AuthUser;
};

type AuthServiceLike = {
  register(body: unknown): Promise<unknown>;
  login(body: unknown): Promise<AuthResult>;
  googleLogin(body: unknown): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthResult>;
  verifyEmailToken(token: string): Promise<unknown>;
  resendVerification(body: unknown): Promise<unknown>;
};

function getRefreshCookieConfig(): { name: string; options: CookieOptions } {
  const isProd = process.env.NODE_ENV === 'production';
  const name = process.env.REFRESH_COOKIE_NAME || 'tv_refresh';
  const maxAgeDays = Number(process.env.REFRESH_COOKIE_MAX_AGE_DAYS || 30);
  const domain = process.env.COOKIE_DOMAIN ? String(process.env.COOKIE_DOMAIN).trim() : undefined;
  const sameSiteRaw = process.env.COOKIE_SAMESITE ? String(process.env.COOKIE_SAMESITE).trim() : '';
  const secureRaw = process.env.COOKIE_SECURE ? String(process.env.COOKIE_SECURE).trim() : '';

  const sameSite = (sameSiteRaw || (isProd ? 'none' : 'lax')) as CookieOptions['sameSite'];
  const secure = secureRaw ? secureRaw === 'true' : isProd;

  return {
    name,
    options: {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/auth',
      ...(domain ? { domain } : {}),
      ...(Number.isFinite(maxAgeDays) && maxAgeDays > 0
        ? { maxAge: maxAgeDays * 24 * 60 * 60 * 1000 }
        : {}),
    },
  };
}

export class AuthController {
  authService: AuthServiceLike;

  constructor(authService: AuthServiceLike) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  google = async (req: Request, res: Response) => {
    const result = await this.authService.googleLogin(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  refresh = async (req: Request, res: Response) => {
    const { name, options } = getRefreshCookieConfig();
    const refreshToken = req.cookies?.[name] as string | undefined;
    if (!refreshToken) {
      throw new AppError('Missing refresh token', 401, 'UNAUTHORIZED');
    }

    const result = await this.authService.refresh(refreshToken);
    const nextRefresh = signRefreshToken(result.user);
    res.cookie(name, nextRefresh, options);

    res.status(200).json({ token: result.token, user: result.user });
  };

  logout = async (_req: Request, res: Response) => {
    const { name, options } = getRefreshCookieConfig();
    res.clearCookie(name, options);
    res.status(200).json({ success: true });
  };

  verifyEmail = async (req: Request, res: Response) => {
    const queryToken =
      typeof req.query?.token === 'string' ? req.query.token : Array.isArray(req.query?.token) ? req.query.token[0] : undefined;
    const bodyToken = typeof req.body?.token === 'string' ? req.body.token : undefined;
    const token = bodyToken || queryToken;
    const result = await this.authService.verifyEmailToken(String(token || ''));
    res.status(200).json(result);
  };

  resendVerification = async (req: Request, res: Response) => {
    const result = await this.authService.resendVerification(req.body);
    res.status(200).json(result);
  };
}
