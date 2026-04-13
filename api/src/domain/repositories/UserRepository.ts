/**
 * User repository (data access for `users` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';
import { User, type UserRecord } from '../entity/User.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type CreateUserInput = {
  username: string;
  email: string;
  password_hash: string | null;
  avatar_url?: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('User already exists', 409, 'DUPLICATE');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapUser = (row: UserRecord): User => new User(row);
const mapUserFromUnknown = (row: unknown): User => mapUser(row as unknown as UserRecord);

// Data-access layer for reading/writing users in Supabase (with schema-compat retries).
export class UserRepository {
  _banColumnsSupported: boolean | null;

  /**
   * Construct the repository with feature-detection flags unset.
   * @returns A `UserRepository` instance.
   */
  constructor() {
    this._banColumnsSupported = null;
  }

  /**
   * Base list of user columns available in early schemas.
   * @returns A comma-separated column list for Supabase `.select()`.
   */
  baseSelectColumns(): string {
    return 'id, username, email, password_hash, avatar_url, email_verified_at, created_at';
  }

  /**
   * Column list for selects, including optional ban fields when the schema supports them.
   * @returns A comma-separated column list for Supabase `.select()`.
   */
  selectColumns(): string {
    return this._banColumnsSupported === false
      ? this.baseSelectColumns()
      : `${this.baseSelectColumns()}, is_banned, banned_reason, banned_at`;
  }

  /**
   * Detect a "missing column" database error (used to downgrade selects for older schemas).
   * @param error Supabase error-like object.
   * @returns True if the error indicates a missing column.
   */
  isSchemaMissingColumn(error: DatabaseErrorLike): boolean {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  /**
   * Load multiple users by id.
   * @param ids User id list (duplicates/empties are ignored).
   * @returns Array of matched users (order not guaranteed).
   */
  async findByIds(ids: string[] = []): Promise<User[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await supabase.from('users').select(this.selectColumns()).in('id', unique);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).in('id', unique);
      if (retry.error) throw toAppError(retry.error);
      return (retry.data || []).map(mapUserFromUnknown);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapUserFromUnknown);
  }

  /**
   * Load a user by id.
   * @param id User id.
   * @returns The user or `null` if not found.
   */
  async findById(id: string): Promise<User | null> {
    const res = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  /**
   * Load a user by email.
   * @param email Email address.
   * @returns The user or `null` if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    const res = await supabase.from('users').select(this.selectColumns()).eq('email', email).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).eq('email', email).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  /**
   * Load a user by username.
   * @param username Username.
   * @returns The user or `null` if not found.
   */
  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = String(username || '').trim();
    if (!normalizedUsername) return null;
    const res = await supabase
      .from('users')
      .select(this.selectColumns())
      .eq('username', normalizedUsername)
      .limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase
        .from('users')
        .select(this.selectColumns())
        .eq('username', normalizedUsername)
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  /**
   * Create a new user record.
   * @param username Username (trimmed).
   * @param email Email (trimmed).
   * @param password_hash Bcrypt hash (required for password auth).
   * @param avatar_url Optional avatar URL.
   * @returns The created user.
   */
  async create({ username, email, password_hash, avatar_url = undefined }: CreateUserInput): Promise<User> {
    const payload = {
      username: username.trim(),
      email: email.trim(),
      password_hash,
      ...(avatar_url ? { avatar_url: String(avatar_url).trim().slice(0, 500) } : {}),
    };
    const res = await supabase.from('users').insert(payload).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').insert(payload).select(this.selectColumns()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      if (!retry.data?.[0]) throw new AppError('Failed to create user', 500, 'DB_ERROR');
      return mapUserFromUnknown(retry.data[0]);
    }
    if (res.error) throw toAppError(res.error);
    if (!res.data?.[0]) throw new AppError('Failed to create user', 500, 'DB_ERROR');
    return mapUserFromUnknown(res.data[0]);
  }

  /**
   * Mark a user as email-verified.
   * @param userId User id.
   * @returns The updated user or `null` if not found.
   */
  async markEmailVerified(userId: string): Promise<User | null> {
    const patch = { email_verified_at: new Date().toISOString() };
    const res = await supabase.from('users').update(patch).eq('id', userId).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Older DB schema: retry without ban-related columns and remember the downgrade.
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').update(patch).eq('id', userId).select(this.selectColumns()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  /**
   * Ban a user (requires ban columns to exist in the schema).
   * @param userId User id.
   * @param reason Optional admin-provided reason (stored for display/moderation).
   * @param adminEmail Optional admin identifier for auditing.
   * @returns The updated user or `null` if not found.
   */
  async banUser(userId: string, { reason = null, adminEmail = null }: { reason?: string | null; adminEmail?: string | null } = {}): Promise<User | null> {
    if (this._banColumnsSupported === false) {
      throw new AppError(
        'Users table schema mismatch (missing ban columns). Apply `TriviaVerse/api/sql/005_quiz_reports_and_bans.sql`.',
        500,
        'DB_SCHEMA_MISMATCH'
      );
    }

    const patch = {
      is_banned: true,
      banned_reason: reason ? String(reason).trim().slice(0, 400) : null,
      banned_at: new Date().toISOString(),
      banned_by_admin_email: adminEmail ? String(adminEmail).trim().toLowerCase() : null,
    };
    const res = await supabase.from('users').update(patch).eq('id', userId).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      // Pin the feature flag so later selects avoid columns that don't exist.
      this._banColumnsSupported = false;
      throw new AppError(
        'Users table schema mismatch (missing ban columns). Apply `TriviaVerse/api/sql/005_quiz_reports_and_bans.sql`.',
        500,
        'DB_SCHEMA_MISMATCH'
      );
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }
}
