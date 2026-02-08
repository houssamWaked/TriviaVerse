/**
 * JWT helpers used by auth middleware and controllers.
 */
import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

function getJwtSecret() {
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

function getRefreshSecret() {
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

/**
 * Sign an access token for a user.
 *
 * @param {{ id: string, email?: string, username?: string }} user
 * @returns {string} JWT access token
 */
export function signAccessToken(user) {
  const secret = getJwtSecret();

  const { issuer, audience } = getJwtIssuerAudience();

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    secret,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
      algorithm: 'HS256',
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    }
  );
}

/**
 * Verify a Bearer token and return the decoded payload.
 *
 * @param {string} token
 * @returns {{ sub: string, email?: string, username?: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  const secret = getJwtSecret();
  const { issuer, audience } = getJwtIssuerAudience();
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
  } catch (err) {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}

/**
 * Sign a refresh token for a user.
 *
 * @param {{ id: string, email?: string, username?: string }} user
 * @returns {string} JWT refresh token
 */
export function signRefreshToken(user) {
  const secret = getRefreshSecret();
  const { issuer, audience } = getJwtIssuerAudience();
  return jwt.sign(
    {
      sub: user.id,
      typ: 'refresh',
      email: user.email,
      username: user.username,
    },
    secret,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      algorithm: 'HS256',
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    }
  );
}

/**
 * Verify a refresh token and return the decoded payload.
 *
 * @param {string} token
 * @returns {{ sub: string, typ?: string, email?: string, username?: string, iat: number, exp: number }}
 */
export function verifyRefreshToken(token) {
  const secret = getRefreshSecret();
  const { issuer, audience } = getJwtIssuerAudience();
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
    if (decoded?.typ !== 'refresh') {
      throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }
}
