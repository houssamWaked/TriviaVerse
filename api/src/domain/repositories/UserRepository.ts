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

export class UserRepository {
  _banColumnsSupported: boolean | null;

  constructor() {
    this._banColumnsSupported = null;
  }

  baseSelectColumns(): string {
    return 'id, username, email, password_hash, avatar_url, email_verified_at, created_at';
  }

  selectColumns(): string {
    return this._banColumnsSupported === false
      ? this.baseSelectColumns()
      : `${this.baseSelectColumns()}, is_banned, banned_reason, banned_at`;
  }

  isSchemaMissingColumn(error: DatabaseErrorLike): boolean {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  async findByIds(ids: string[] = []): Promise<User[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await supabase.from('users').select(this.selectColumns()).in('id', unique);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).in('id', unique);
      if (retry.error) throw toAppError(retry.error);
      return (retry.data || []).map(mapUserFromUnknown);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapUserFromUnknown);
  }

  async findById(id: string): Promise<User | null> {
    const res = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const res = await supabase.from('users').select(this.selectColumns()).eq('email', email).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).eq('email', email).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const normalizedUsername = String(username || '').trim();
    if (!normalizedUsername) return null;
    const res = await supabase
      .from('users')
      .select(this.selectColumns())
      .eq('username', normalizedUsername)
      .limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
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

  async create({ username, email, password_hash, avatar_url = undefined }: CreateUserInput): Promise<User> {
    const payload = {
      username: username.trim(),
      email: email.trim(),
      password_hash,
      ...(avatar_url ? { avatar_url: String(avatar_url).trim().slice(0, 500) } : {}),
    };
    const res = await supabase.from('users').insert(payload).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
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

  async markEmailVerified(userId: string): Promise<User | null> {
    const patch = { email_verified_at: new Date().toISOString() };
    const res = await supabase.from('users').update(patch).eq('id', userId).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').update(patch).eq('id', userId).select(this.selectColumns()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapUserFromUnknown(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapUserFromUnknown(res.data[0]) : null;
  }

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
