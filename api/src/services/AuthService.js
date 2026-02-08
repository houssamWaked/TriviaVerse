/**
 * Auth service.
 *
 * This project uses a custom `users` table (not Supabase Auth).
 * Passwords are hashed with bcrypt and verified on login.
 */
import bcrypt from 'bcryptjs';
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';
import { signAccessToken } from '../utils/jwt.js';
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
        if (!this.#isProd()) {
          // eslint-disable-next-line no-console
          console.warn('[auth] Supabase email send failed:', error.message || error);
        }
        if (this.#isProd()) {
          throw new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
        }
      } else {
        return;
      }
    }

    // Fallback (dev): log a usable verification link/token to the API console.
    const url = buildEmailVerificationUrl(token);
    if (this.#isProd()) {
      throw new AppError(
        'Email verification is not configured (missing SUPABASE_ANON_KEY or redirect URL).',
        500,
        'EMAIL_NOT_CONFIGURED'
      );
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
    await this.#deliverVerification(user, verifyToken);

    const payload = { success: true };
    if (!this.#isProd()) {
      payload.verification_url = buildEmailVerificationUrl(verifyToken);
      payload.verification_token = verifyToken;
    }
    return payload;
  }
}
