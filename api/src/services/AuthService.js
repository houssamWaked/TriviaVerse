/**
 * Auth service.
 *
 * This project uses a custom `users` table (not Supabase Auth).
 * Passwords are hashed with bcrypt and verified on login.
 */
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';
import { signAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { supabasePublic } from '../config/supabase.js';
import {
  buildEmailVerificationRedirectUrl,
  buildEmailVerificationUrl,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
} from '../utils/emailVerification.js';

const EMAIL_SEND_THROTTLE_MS = Number(process.env.EMAIL_SEND_THROTTLE_MS || 60_000);
const lastVerificationAttemptMsByEmail = new Map();

function markVerificationAttempt(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return;
  lastVerificationAttemptMsByEmail.set(key, Date.now());
}

function isVerificationThrottled(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return false;
  const last = lastVerificationAttemptMsByEmail.get(key);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last < Math.max(0, Number(EMAIL_SEND_THROTTLE_MS) || 0);
}

export class AuthService {
  constructor(userRepository, userStatsRepository) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;

    this._googleClient = null;
  }

  #isProd() {
    return process.env.NODE_ENV === 'production';
  }

  #getGoogleClient() {
    const raw = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    const audiences = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryClientId = audiences[0] || '';

    if (!primaryClientId) {
      throw new AppError('Google login is not configured', 503, 'GOOGLE_NOT_CONFIGURED', {
        missing: ['GOOGLE_CLIENT_ID'],
      });
    }
    if (!this._googleClient) this._googleClient = new OAuth2Client(primaryClientId);
    return { audiences, client: this._googleClient };
  }

  async #ensureUniqueUsername(base) {
    const cleaned = String(base || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20);

    const fallbackBase = cleaned.length >= 3 ? cleaned : 'player';

    const direct = await this.userRepository.findByUsername(fallbackBase);
    if (!direct) return fallbackBase;

    for (let i = 0; i < 25; i += 1) {
      const suffix = randomBytes(3).toString('hex'); // 6 chars
      const candidate = `${fallbackBase}_${suffix}`.slice(0, 30);
      // eslint-disable-next-line no-await-in-loop
      const existing = await this.userRepository.findByUsername(candidate);
      if (!existing) return candidate;
    }

    throw new AppError('Failed to generate a unique username', 500, 'USERNAME_GENERATION_FAILED');
  }

  async #deliverVerification(user, token) {
    if (process.env.NODE_ENV === 'test') return;

    const redirectTo = buildEmailVerificationRedirectUrl(token);
    if (supabasePublic && redirectTo) {
      if (isVerificationThrottled(user?.email)) {
        throw new AppError(
          'Too many verification emails. Please wait and try again.',
          429,
          'EMAIL_RATE_LIMITED'
        );
      }
      markVerificationAttempt(user?.email);

      const { error } = await supabasePublic.auth.signInWithOtp({
        email: user.email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) {
        // Always log server-side (Railway shows app logs even in production).
        // eslint-disable-next-line no-console
        console.warn('[auth] Supabase email send failed:', {
          message: error?.message || String(error),
          status: error?.status,
          name: error?.name,
        });

        if (this.#isProd()) {
          if (Number(error?.status) === 429) {
            throw new AppError(
              'Too many verification emails. Please wait and try again.',
              429,
              'EMAIL_RATE_LIMITED',
              {
                provider_status: error?.status ?? undefined,
                provider_message: String(error?.message || '').slice(0, 300) || undefined,
              }
            );
          }
          throw new AppError('Failed to send verification email', 502, 'EMAIL_SEND_FAILED', {
            provider_status: error?.status ?? undefined,
            provider_message: String(error?.message || '').slice(0, 300) || undefined,
          });
        }
      } else {
        return;
      }
    }

    // Fallback (dev): log a usable verification link/token to the API console.
    const url = buildEmailVerificationUrl(token);
    if (this.#isProd()) {
      // eslint-disable-next-line no-console
      console.error('[auth] Email verification not configured', {
        hasSupabaseAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
        hasSupabasePublicClient: Boolean(supabasePublic),
        hasRedirectUrl: Boolean(redirectTo),
        hasUrlBase: Boolean(String(process.env.EMAIL_VERIFICATION_URL_BASE || '').trim()),
        hasRedirectBase: Boolean(String(process.env.EMAIL_VERIFICATION_REDIRECT_URL_BASE || '').trim()),
      });

      throw new AppError('Email verification is not configured', 503, 'EMAIL_NOT_CONFIGURED', {
        missing: {
          SUPABASE_ANON_KEY: !Boolean(process.env.SUPABASE_ANON_KEY),
          EMAIL_VERIFICATION_REDIRECT_URL_BASE: !Boolean(
            String(process.env.EMAIL_VERIFICATION_REDIRECT_URL_BASE || '').trim()
          ),
          EMAIL_VERIFICATION_URL_BASE: !Boolean(
            String(process.env.EMAIL_VERIFICATION_URL_BASE || '').trim()
          ),
        },
      });
    }
    const display = url || token;
    // eslint-disable-next-line no-console
    console.log(`[auth] Email verification for ${user.email}: ${display}`);
  }

  async register({ username, email, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409, 'DUPLICATE');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ username, email, password_hash });
    await this.userStatsRepository.createDefault(user.id);

    const verifyToken = signEmailVerificationToken(user);
    let email_delivery = { ok: true };
    try {
      await this.#deliverVerification(user, verifyToken);
    } catch (err) {
      // In production, don't fail signup just because email delivery is rate-limited
      // or the provider is temporarily down. The user can retry via "Resend verification".
      if (this.#isProd() && (err?.code === 'EMAIL_SEND_FAILED' || err?.code === 'EMAIL_RATE_LIMITED')) {
        // eslint-disable-next-line no-console
        console.warn('[auth] Verification email delivery failed during register (continuing)', {
          code: err?.code,
          message: err?.message,
        });
        email_delivery = { ok: false, code: err?.code };
      } else {
        throw err;
      }
    }

    const payload = {
      user: UserDTO.fromEntity(user),
      needs_email_verification: true,
      ...(email_delivery?.ok === false ? { email_delivery } : {}),
    };
    if (!this.#isProd()) {
      payload.verification_url = buildEmailVerificationUrl(verifyToken);
      payload.verification_token = verifyToken;
    }
    return payload;
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
    }

    if (user.is_banned) {
      throw new AppError('Account banned', 403, 'BANNED', {
        reason: user.banned_reason || undefined,
      });
    }

    if (!user.email_verified_at) {
      throw new AppError(
        'Email not verified. Please check your inbox for the verification link.',
        403,
        'EMAIL_NOT_VERIFIED',
        !this.#isProd()
          ? {
              verification_url: buildEmailVerificationUrl(signEmailVerificationToken(user)),
              verification_token: signEmailVerificationToken(user),
            }
          : undefined
      );
    }

    const token = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token };
  }

  async googleLogin({ id_token }) {
    const token = String(id_token || '').trim();
    if (!token) throw new AppError('id_token is required', 400, 'VALIDATION_ERROR');

    const { audiences, client } = this.#getGoogleClient();

    let payload = null;
    try {
      const ticket = await client.verifyIdToken({ idToken: token, audience: audiences });
      payload = ticket.getPayload();
    } catch (err) {
      throw new AppError('Invalid Google token', 401, 'UNAUTHORIZED');
    }

    const email = String(payload?.email || '').trim().toLowerCase();
    const emailVerified = Boolean(payload?.email_verified);
    if (!email) throw new AppError('Google account missing email', 400, 'GOOGLE_PROFILE_INVALID');
    if (!emailVerified) {
      throw new AppError('Google email is not verified', 403, 'GOOGLE_EMAIL_NOT_VERIFIED');
    }

    const displayName = String(payload?.name || '').trim();
    const picture = String(payload?.picture || '').trim();

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      const base = displayName || email.split('@')[0] || 'player';
      const username = await this.#ensureUniqueUsername(base);
      const password_hash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);

      user = await this.userRepository.create({
        username,
        email,
        password_hash,
        avatar_url: picture || undefined,
      });
      await this.userStatsRepository.createDefault(user.id);
      await this.userRepository.markEmailVerified(user.id);
      user = (await this.userRepository.findById(user.id)) || user;
    } else {
      if (user.is_banned) {
        throw new AppError('Account banned', 403, 'BANNED', {
          reason: user.banned_reason || undefined,
        });
      }

      if (!user.email_verified_at) {
        user = (await this.userRepository.markEmailVerified(user.id)) || user;
      }
    }

    const access = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token: access };
  }

  async refresh(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const userId = decoded.sub;

    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('Invalid refresh token', 401, 'UNAUTHORIZED');
    if (user.is_banned) throw new AppError('Account banned', 403, 'BANNED');
    if (!user.email_verified_at) {
      throw new AppError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
    }

    const token = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token };
  }

  async verifyEmailToken(token) {
    const { userId, email } = verifyEmailVerificationToken(token);

    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    if (String(user.email || '').trim().toLowerCase() !== String(email).trim().toLowerCase()) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }

    if (user.email_verified_at) {
      return { success: true, already_verified: true };
    }

    const updated = await this.userRepository.markEmailVerified(userId);
    if (!updated) throw new AppError('Failed to verify email', 500, 'DB_ERROR');
    return { success: true };
  }

  async resendVerification({ email }) {
    const user = await this.userRepository.findByEmail(email);
    // Avoid account enumeration: return 204-ish response shape even if no user.
    if (!user) return { success: true };
    if (user.email_verified_at) return { success: true, already_verified: true };

    const verifyToken = signEmailVerificationToken(user);
    try {
      await this.#deliverVerification(user, verifyToken);
    } catch (err) {
      // Avoid account enumeration in production: always return success even if
      // email delivery fails (misconfig, provider outage, etc.).
      if (this.#isProd()) {
        // eslint-disable-next-line no-console
        console.warn('[auth] Resend verification failed (suppressed)', {
          code: err?.code,
          message: err?.message,
        });
        return { success: true };
      }
      throw err;
    }

    const payload = { success: true };
    if (!this.#isProd()) {
      payload.verification_url = buildEmailVerificationUrl(verifyToken);
      payload.verification_token = verifyToken;
    }
    return payload;
  }
}
