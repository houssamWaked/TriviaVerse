/**
 * JWT helpers used by auth middleware and controllers.
 */
import jwt, { type JwtPayload, type SignOptions, type Secret } from 'jsonwebtoken';
import AppError from './AppError.js';

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email?: string;
  username?: string;
};

type RefreshTokenPayload = AccessTokenPayload & {
  typ: 'refresh';
};

type TokenUser = {
  id: string;
  email?: string;
  username?: string;
};

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Missing JWT_SECRET', 500, 'CONFIG_ERROR');
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && String(secret).length < 32) {
    throw new AppError('JWT_SECRET is too short (min 32 chars)', 500, 'CONFIG_ERROR');
  }
  return secret;
}

function getRefreshSecret(): Secret {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Missing JWT_REFRESH_SECRET', 500, 'CONFIG_ERROR');
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && String(secret).length < 32) {
    throw new AppError('JWT_REFRESH_SECRET is too short (min 32 chars)', 500, 'CONFIG_ERROR');
  }
  return secret;
}

function getJwtIssuerAudience() {
  const issuer = process.env.JWT_ISSUER ? String(process.env.JWT_ISSUER).trim() : '';
  const audience = process.env.JWT_AUDIENCE ? String(process.env.JWT_AUDIENCE).trim() : '';
  return { issuer, audience };
}

function buildTokenOptions(expiresIn: string): SignOptions {
  const { issuer, audience } = getJwtIssuerAudience();
  return {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    algorithm: 'HS256',
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  };
}

export function signAccessToken(user: TokenUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    getJwtSecret(),
    buildTokenOptions(process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m')
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { issuer, audience } = getJwtIssuerAudience();
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
    if (typeof decoded === 'string' || !decoded?.sub) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }
    return decoded as AccessTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}

export function signRefreshToken(user: TokenUser) {
  return jwt.sign(
    {
      sub: user.id,
      typ: 'refresh',
      email: user.email,
      username: user.username,
    },
    getRefreshSecret(),
    buildTokenOptions(process.env.JWT_REFRESH_EXPIRES_IN || '30d')
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const { issuer, audience } = getJwtIssuerAudience();
  try {
    const decoded = jwt.verify(token, getRefreshSecret(), {
      algorithms: ['HS256'],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
    if (typeof decoded === 'string' || decoded?.typ !== 'refresh' || !decoded?.sub) {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
    return decoded as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }
}
