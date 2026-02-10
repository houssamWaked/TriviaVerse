/**
 * Auth service.
 *
 * This project uses a custom `users` table (not Supabase Auth).
 * Passwords are hashed with bcrypt and verified on login.
 */
import bcrypt from 'bcryptjs';
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

export class AuthService {
  constructor(userRepository, userStatsRepository) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
  }

  #isProd() {
    return process.env.NODE_ENV === 'production';
  }

  async #deliverVerification(user, token) {
    if (process.env.NODE_ENV === 'test') return;

    const redirectTo = buildEmailVerificationRedirectUrl(token);
    if (supabasePublic && redirectTo) {
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
          throw new AppError('Failed to send verification email', 502, 'EMAIL_SEND_FAILED');
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
    await this.#deliverVerification(user, verifyToken);

    const payload = {
      user: UserDTO.fromEntity(user),
      needs_email_verification: true,
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
      const verifyToken = signEmailVerificationToken(user);
      await this.#deliverVerification(user, verifyToken);
      throw new AppError(
        'Email not verified. Please check your inbox for the verification link.',
        403,
        'EMAIL_NOT_VERIFIED',
        !this.#isProd()
          ? {
              verification_url: buildEmailVerificationUrl(verifyToken),
              verification_token: verifyToken,
            }
          : undefined
      );
    }

    const token = signAccessToken(user);
    return { user: UserDTO.fromEntity(user), token };
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
