/**
 * Auth controller.
 */
import AppError from '../utils/AppError.js';
import { signRefreshToken } from '../utils/jwt.js';

function getRefreshCookieConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const name = process.env.REFRESH_COOKIE_NAME || 'tv_refresh';
  const maxAgeDays = Number(process.env.REFRESH_COOKIE_MAX_AGE_DAYS || 30);
  const domain = process.env.COOKIE_DOMAIN ? String(process.env.COOKIE_DOMAIN).trim() : undefined;
  const sameSiteRaw = process.env.COOKIE_SAMESITE ? String(process.env.COOKIE_SAMESITE).trim() : '';
  const secureRaw = process.env.COOKIE_SECURE ? String(process.env.COOKIE_SECURE).trim() : '';

  const sameSite = sameSiteRaw || (isProd ? 'none' : 'lax');
  const secure = secureRaw ? secureRaw === 'true' : isProd;

  return {
    name,
    options: {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/auth',
      ...(domain ? { domain } : {}),
      ...(Number.isFinite(maxAgeDays) && maxAgeDays > 0 ? { maxAge: maxAgeDays * 24 * 60 * 60 * 1000 } : {}),
    },
  };
}

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  google = async (req, res) => {
    const result = await this.authService.googleLogin(req.body);
    const { name, options } = getRefreshCookieConfig();
    const refresh = signRefreshToken(result.user);
    res.cookie(name, refresh, options);
    res.status(200).json(result);
  };

  refresh = async (req, res) => {
    const { name, options } = getRefreshCookieConfig();
    const refreshToken = req.cookies?.[name];
    if (!refreshToken) {
      throw new AppError('Missing refresh token', 401, 'UNAUTHORIZED');
    }

    const result = await this.authService.refresh(refreshToken);

    // Rotate refresh token cookie on each refresh.
    const nextRefresh = signRefreshToken(result.user);
    res.cookie(name, nextRefresh, options);

    res.status(200).json({ token: result.token, user: result.user });
  };

  logout = async (req, res) => {
    const { name, options } = getRefreshCookieConfig();
    res.clearCookie(name, options);
    res.status(200).json({ success: true });
  };

  verifyEmail = async (req, res) => {
    const token = req.body?.token || req.query?.token;
    const result = await this.authService.verifyEmailToken(token);
    res.status(200).json(result);
  };

  resendVerification = async (req, res) => {
    const result = await this.authService.resendVerification(req.body);
    res.status(200).json(result);
  };
}
