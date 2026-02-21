/**
 * User stats repository (`user_stats` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class UserStatsRepository {
  async listByUserIds(userIds = []) {
    const ids = Array.from(new Set((userIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('user_stats')
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .in('user_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async createDefault(userId) {
    const { error } = await supabase.from('user_stats').insert({ user_id: userId });
    if (error) throw toAppError(error);
    return true;
  }

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .eq('user_id', userId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async addXp(userId, xpDelta) {
    const current = await this.findByUserId(userId);
    const nextXp = (current?.xp_total ?? 0) + Math.max(0, xpDelta || 0);
    const nextLevel = Math.max(1, Math.floor(nextXp / 1000) + 1);

    const { data, error } = await supabase
      .from('user_stats')
      .update({
        xp_total: nextXp,
        level: nextLevel,
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async resetProgress(userId) {
    const uid = String(userId || '').trim();
    if (!uid) return null;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_stats')
      .upsert(
        {
          user_id: uid,
          xp_total: 0,
          level: 1,
          streak_days: 0,
          last_active_at: now,
        },
        { onConflict: 'user_id' }
      )
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
