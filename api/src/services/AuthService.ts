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
const lastVerificationAttemptMsByEmail = new Map<string, number>();

type ErrorWithCode = Error & {
  code?: string;
  status?: number;
};

type UserLike = {
  id: string;
  username: string;
  email: string;
  password_hash?: string | null;
  avatar_url?: string | null;
  is_banned?: boolean | null;
  banned_reason?: string | null;
  email_verified_at?: string | null;
};

type UserRepositoryLike = {
  findByEmail(email: string): Promise<UserLike | null>;
  findByUsername(username: string): Promise<UserLike | null>;
  create(input: {
    username: string;
    email: string;
    password_hash: string;
    avatar_url?: string | null | undefined;
  }): Promise<UserLike | null>;
  markEmailVerified(userId: string): Promise<UserLike | null>;
  findById(userId: string): Promise<UserLike | null>;
};

type UserStatsRepositoryLike = {
  createDefault(userId: string): Promise<unknown>;
};

type GooglePayloadLike = {
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
  picture?: string | null;
};

function markVerificationAttempt(email: string | null | undefined): void {
  const key = String(email || '')
    .trim()
    .toLowerCase();
  if (!key) return;
  lastVerificationAttemptMsByEmail.set(key, Date.now());
}

function isVerificationThrottled(email: string | null | undefined): boolean {
  const key = String(email || '')
    .trim()
    .toLowerCase();
  if (!key) return false;
  const last = lastVerificationAttemptMsByEmail.get(key);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last < Math.max(0, Number(EMAIL_SEND_THROTTLE_MS) || 0);
}

// Domain service responsible for registration/login/token refresh and email verification flows.
export class AuthService {
  private userRepository: UserRepositoryLike;
  private userStatsRepository: UserStatsRepositoryLike;
  private _googleClient: OAuth2Client | null;

  /**
   * Construct the auth service.
   * @param userRepository Repository for user records.
   * @param userStatsRepository Repository for per-user stats initialization.
   * @returns An `AuthService` instance.
   */
  constructor(userRepository: UserRepositoryLike, userStatsRepository: UserStatsRepositoryLike) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;

    this._googleClient = null;
  }

  /**
   * Determine whether the service is running in production mode.
   * @returns True when `NODE_ENV === 'production'`.
   */
  #isProd() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Lazily initialize the Google OAuth client and parse configured audiences.
   * @returns The OAuth client + list of accepted client IDs (audiences).
   */
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

  /**
   * Generate a unique username by normalizing the base and trying random suffixes.
   * @param base Desired username seed (name/email prefix).
   * @returns A unique username string.
   */
  async #ensureUniqueUsername(base: string): Promise<string> {
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

  /**
   * Send an email verification link using Supabase OTP (when configured) or a dev console fallback.
   * @param user The user who needs verification.
   * @param token Signed verification token to embed in the link.
   * @returns Resolves when delivery is attempted/queued; may throw on hard failures.
   */
  async #deliverVerification(user: UserLike, token: string): Promise<void> {
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
      // Throttle by email to avoid provider rate limits and spam.
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
        hasRedirectBase: Boolean(
          String(process.env.EMAIL_VERIFICATION_REDIRECT_URL_BASE || '').trim()
        ),
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

  /**
   * Create a new user account and trigger email verification.
   * @param username Desired username.
   * @param email Email address (unique).
   * @param password Plaintext password (will be bcrypt-hashed).
   * @returns Registration result including `needs_email_verification` and dev-only verification helpers.
   */
  async register({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409, 'DUPLICATE');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ username, email, password_hash });
    await this.userStatsRepository.createDefault(user.id);

    const verifyToken = signEmailVerificationToken(user);
    let email_delivery: { ok: boolean; code?: string } = { ok: true };
    try {
      await this.#deliverVerification(user, verifyToken);
    } catch (err) {
      const error = err as ErrorWithCode;
      // In production, don't fail signup just because email delivery is rate-limited
      // or the provider is temporarily down. The user can retry via "Resend verification".
      if (
        this.#isProd() &&
        (error.code === 'EMAIL_SEND_FAILED' || error.code === 'EMAIL_RATE_LIMITED')
      ) {
        // eslint-disable-next-line no-console
        console.warn('[auth] Verification email delivery failed during register (continuing)', {
          code: error.code,
          message: error.message,
        });
        email_delivery = { ok: false, code: error.code };
      } else {
        throw err;
      }
    }

    const payload: {
      user: ReturnType<typeof UserDTO.fromEntity>;
      needs_email_verification: boolean;
      email_delivery?: { ok: boolean; code?: string };
      verification_url?: string | null;
      verification_token?: string;
    } = {
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

  /**
   * Authenticate a user with email/password and issue an access token.
   * @param email Account email.
   * @param password Plaintext password.
   * @returns `{ user, token }` when credentials are valid.
   */
  async login({ email, password }: { email: string; password: string }) {
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

  /**
   * Authenticate (or create) a user using a Google ID token.
   * @param id_token Google ID token from the client.
   * @returns `{ user, token }` for the authenticated account.
   */
  async googleLogin({ id_token }: { id_token: string }) {
    const token = String(id_token || '').trim();
    if (!token) throw new AppError('id_token is required', 400, 'VALIDATION_ERROR');

    const { audiences, client } = this.#getGoogleClient();

    let payload: GooglePayloadLike | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken: token, audience: audiences });
      payload = ticket.getPayload() as GooglePayloadLike | undefined;
    } catch (err) {
      throw new AppError('Invalid Google token', 401, 'UNAUTHORIZED');
    }

    const email = String(payload?.email || '')
      .trim()
      .toLowerCase();
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

  /**
   * Exchange a refresh token for a new access token.
   * @param refreshToken Signed refresh token (usually from the httpOnly cookie).
   * @returns `{ user, token }` for the refreshed session.
   */
  async refresh(refreshToken: string) {
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

  /**
   * Verify an email verification token and mark the user as verified.
   * @param token Signed verification token.
   * @returns Verification outcome (including `already_verified` when applicable).
   */
  async verifyEmailToken(token: string) {
    const { userId, email } = verifyEmailVerificationToken(token);

    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    if (
      String(user.email || '')
        .trim()
        .toLowerCase() !== String(email).trim().toLowerCase()
    ) {
      throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
    }

    if (user.email_verified_at) {
      return { success: true, already_verified: true };
    }

    const updated = await this.userRepository.markEmailVerified(userId);
    if (!updated) throw new AppError('Failed to verify email', 500, 'DB_ERROR');
    return { success: true };
  }

  /**
   * Trigger a new verification email for an unverified account.
   * @param email Target email address.
   * @returns `{ success: true }` (suppresses delivery failures in production to avoid enumeration).
   */
  async resendVerification({ email }: { email: string }) {
    const user = await this.userRepository.findByEmail(email);
    // Avoid account enumeration: return 204-ish response shape even if no user.
    if (!user) return { success: true };
    if (user.email_verified_at) return { success: true, already_verified: true };

    const verifyToken = signEmailVerificationToken(user);
    try {
      await this.#deliverVerification(user, verifyToken);
    } catch (err) {
      const error = err as ErrorWithCode;
      // Avoid account enumeration in production: always return success even if
      // email delivery fails (misconfig, provider outage, etc.).
      if (this.#isProd()) {
        // eslint-disable-next-line no-console
        console.warn('[auth] Resend verification failed (suppressed)', {
          code: error.code,
          message: error.message,
        });
        return { success: true };
      }
      throw err;
    }

    const payload: {
      success: boolean;
      already_verified?: boolean;
      verification_url?: string | null;
      verification_token?: string;
    } = { success: true };
    if (!this.#isProd()) {
      payload.verification_url = buildEmailVerificationUrl(verifyToken);
      payload.verification_token = verifyToken;
    }
    return payload;
  }
}

