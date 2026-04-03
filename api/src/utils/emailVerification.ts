/**
 * Email verification token helpers.
 *
 * Uses JWT signed tokens so we don't need to store one-time tokens in the DB.
 */
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import AppError from './AppError.js';

type EmailVerificationUser = {
  id: string;
  email: string;
};

type EmailVerificationPayload = JwtPayload & {
  typ: 'email_verify';
  sub: string;
  email: string;
};

function normalizeUrlBase(value: string | undefined | null) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function getSecret() {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new AppError('Missing JWT_SECRET', 500, 'CONFIG_ERROR');
  return secret;
}

export function signEmailVerificationToken(user: EmailVerificationUser) {
  const expiresIn = (process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

  return jwt.sign(
    {
      typ: 'email_verify',
      sub: user.id,
      email: user.email,
    },
    getSecret(),
    { expiresIn }
  );
}

export function verifyEmailVerificationToken(token: string) {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (
      typeof decoded === 'string' ||
      decoded?.typ !== 'email_verify' ||
      !decoded?.sub ||
      !decoded?.email
    ) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }
    const payload = decoded as EmailVerificationPayload;
    return { userId: payload.sub, email: payload.email };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
  }
}

export function buildEmailVerificationUrl(token: string) {
  const base = normalizeUrlBase(process.env.EMAIL_VERIFICATION_URL_BASE);
  if (!base) return null;
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}token=${encodeURIComponent(token)}`;
}

export function buildEmailVerificationRedirectUrl(token: string) {
  const explicit = normalizeUrlBase(process.env.EMAIL_VERIFICATION_REDIRECT_URL_BASE);
  const fromUrlBase = normalizeUrlBase(process.env.EMAIL_VERIFICATION_URL_BASE);
  const base = explicit || (fromUrlBase ? fromUrlBase.split('#')[0] : '');
  const trimmed = String(base || '').trim();
  if (!trimmed) return null;
  const joiner = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${joiner}verify_email_token=${encodeURIComponent(token)}`;
}
