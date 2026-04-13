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

// HTTP adapter for auth-related operations (register/login/refresh/logout/email verification).
export class AuthController {
  authService: AuthServiceLike;

  /**
   * Construct a controller that delegates to an auth service.
   * @param authService Domain service implementing auth operations.
   * @returns A controller instance suitable for Express route handlers.
   */
  constructor(authService: AuthServiceLike) {
    this.authService = authService;
  }

  /**
   * Register a new user.
   * @param req Express request (expects registration payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the registration result.
   */
  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  /**
   * Log a user in and issue a refresh cookie + access token.
   * @param req Express request (expects `{ email, password }` in `req.body`).
   * @param res Express response.
   * @returns A 200 response with `{ user, token }` and a refresh cookie.
   */
  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  /**
   * Log a user in using a Google ID token.
   * @param req Express request (expects `{ id_token }` in `req.body`).
   * @param res Express response.
   * @returns A 200 response with `{ user, token }` and a refresh cookie.
   */
  google = async (req: Request, res: Response) => {
    const result = await this.authService.googleLogin(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  /**
   * Refresh an access token using the httpOnly refresh cookie.
   * @param req Express request (reads refresh cookie from `req.cookies`).
   * @param res Express response.
   * @returns A 200 response with a new access token + rotated refresh cookie.
   */
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

  /**
   * Clear the refresh cookie.
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with `{ success: true }`.
   */
  logout = async (_req: Request, res: Response) => {
    const { name, options } = getRefreshCookieConfig();
    res.clearCookie(name, options);
    res.status(200).json({ success: true });
  };

  /**
   * Verify an email verification token.
   * @param req Express request (reads token from query `?token=` or `req.body.token`).
   * @param res Express response.
   * @returns A 200 response describing verification success/already-verified.
   */
  verifyEmail = async (req: Request, res: Response) => {
    const queryToken =
      typeof req.query?.token === 'string' ? req.query.token : Array.isArray(req.query?.token) ? req.query.token[0] : undefined;
    const bodyToken = typeof req.body?.token === 'string' ? req.body.token : undefined;
    const token = bodyToken || queryToken;
    const result = await this.authService.verifyEmailToken(String(token || ''));
    res.status(200).json(result);
  };

  /**
   * Request a new email verification message.
   * @param req Express request (expects `{ email }` in `req.body`).
   * @param res Express response.
   * @returns A 200 response indicating the resend request was accepted.
   */
  resendVerification = async (req: Request, res: Response) => {
    const result = await this.authService.resendVerification(req.body);
    res.status(200).json(result);
  };
}
