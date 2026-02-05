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
  return secret;
}

/**
 * Sign an access token for a user.
 *
 * @param {{ id: string, email?: string, username?: string }} user
 * @returns {string} JWT access token
 */
export function signAccessToken(user) {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
}

