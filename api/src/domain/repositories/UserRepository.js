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
  async findByIds(ids = []) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .in('id', unique);

    if (error) throw toAppError(error);
    return (data || []).map((r) => new User(r));
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .eq('id', id)
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? new User(data[0]) : null;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .eq('email', email)
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? new User(data[0]) : null;
  }

  async findByUsername(username) {
    const u = String(username || '').trim();
    if (!u) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .eq('username', u)
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? new User(data[0]) : null;
  }

  async create({ username, email, password_hash }) {
    const payload = { username: username?.trim(), email: email?.trim(), password_hash };
    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    if (!data?.[0]) throw new AppError('Failed to create user', 500, 'DB_ERROR');
    return new User(data[0]);
  }

  async markEmailVerified(userId) {
    const { data, error } = await supabase
      .from('users')
      .update({ email_verified_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, username, email, password_hash, avatar_url, email_verified_at, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? new User(data[0]) : null;
  }
}
