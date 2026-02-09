/**
 * Email verification token helpers.
 *
 * Uses JWT signed tokens so we don't need to store one-time tokens in the DB.
 * The only DB state required is `users.email_verified_at`.
 */
import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

function normalizeUrlBase(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function getSecret() {
  // Optional separate secret; falls back to the JWT secret used for access tokens.
  const secret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new AppError('Missing JWT_SECRET', 500, 'CONFIG_ERROR');
  return secret;
}

export function signEmailVerificationToken(user) {
  const secret = getSecret();
  const expiresIn = process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      typ: 'email_verify',
      sub: user.id,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
}

export function verifyEmailVerificationToken(token) {
  const secret = getSecret();

  try {
    const decoded = jwt.verify(token, secret);
    if (decoded?.typ !== 'email_verify') {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }
    if (!decoded?.sub || !decoded?.email) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }
    return { userId: decoded.sub, email: decoded.email };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
  }
}

export function buildEmailVerificationUrl(token) {
  const base = normalizeUrlBase(process.env.EMAIL_VERIFICATION_URL_BASE);
  if (!base) return null;
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}token=${encodeURIComponent(token)}`;
}

export function buildEmailVerificationRedirectUrl(token) {
  const explicit = normalizeUrlBase(process.env.EMAIL_VERIFICATION_REDIRECT_URL_BASE);
  const fromUrlBase = normalizeUrlBase(process.env.EMAIL_VERIFICATION_URL_BASE);
  const base = explicit || (fromUrlBase ? fromUrlBase.split('#')[0] : '');
  const trimmed = String(base || '').trim();
  if (!trimmed) return null;
  const joiner = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${joiner}verify_email_token=${encodeURIComponent(token)}`;
}
