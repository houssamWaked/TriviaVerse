/**
 * User repository (data access for `users` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';
import { User } from '../entity/User.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') {
    return new AppError('User already exists', 409, 'DUPLICATE');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class UserRepository {
  constructor() {
    this._banColumnsSupported = null;
  }

  baseSelectColumns() {
    return 'id, username, email, password_hash, avatar_url, email_verified_at, created_at';
  }

  selectColumns() {
    if (this._banColumnsSupported === false) return this.baseSelectColumns();
    return `${this.baseSelectColumns()}, is_banned, banned_reason, banned_at`;
  }

  isSchemaMissingColumn(error) {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  async findByIds(ids = []) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await supabase.from('users').select(this.selectColumns()).in('id', unique);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).in('id', unique);
      if (retry.error) throw toAppError(retry.error);
      return (retry.data || []).map((r) => new User(r));
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map((r) => new User(r));
  }

  async findById(id) {
    const res = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase.from('users').select(this.selectColumns()).eq('id', id).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? new User(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? new User(res.data[0]) : null;
  }

  async findByEmail(email) {
    const res = await supabase
      .from('users')
      .select(this.selectColumns())
      .eq('email', email)
      .limit(1);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase
        .from('users')
        .select(this.selectColumns())
        .eq('email', email)
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? new User(retry.data[0]) : null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? new User(res.data[0]) : null;
  }

  async findByUsername(username) {
    const u = String(username || '').trim();
    if (!u) return null;
    const res = await supabase
      .from('users')
      .select(this.selectColumns())
      .eq('username', u)
      .limit(1);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase
        .from('users')
        .select(this.selectColumns())
        .eq('username', u)
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? new User(retry.data[0]) : null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? new User(res.data[0]) : null;
  }

  async create({ username, email, password_hash, avatar_url = undefined }) {
    const payload = {
      username: username?.trim(),
      email: email?.trim(),
      password_hash,
      ...(avatar_url ? { avatar_url: String(avatar_url).trim().slice(0, 500) } : {}),
    };
    const res = await supabase.from('users').insert(payload).select(this.selectColumns()).limit(1);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase
        .from('users')
        .insert(payload)
        .select(this.selectColumns())
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      if (!retry.data?.[0]) throw new AppError('Failed to create user', 500, 'DB_ERROR');
      return new User(retry.data[0]);
    }

    if (res.error) throw toAppError(res.error);
    if (!res.data?.[0]) throw new AppError('Failed to create user', 500, 'DB_ERROR');
    return new User(res.data[0]);
  }

  async markEmailVerified(userId) {
    const res = await supabase
      .from('users')
      .update({ email_verified_at: new Date().toISOString() })
      .eq('id', userId)
      .select(this.selectColumns())
      .limit(1);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      const retry = await supabase
        .from('users')
        .update({ email_verified_at: new Date().toISOString() })
        .eq('id', userId)
        .select(this.selectColumns())
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? new User(retry.data[0]) : null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? new User(res.data[0]) : null;
  }

  async banUser(userId, { reason = null, adminEmail = null } = {}) {
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

    const res = await supabase
      .from('users')
      .update(patch)
      .eq('id', userId)
      .select(this.selectColumns())
      .limit(1);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._banColumnsSupported = false;
      throw new AppError(
        'Users table schema mismatch (missing ban columns). Apply `TriviaVerse/api/sql/005_quiz_reports_and_bans.sql`.',
        500,
        'DB_SCHEMA_MISMATCH'
      );
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? new User(res.data[0]) : null;
  }
}
