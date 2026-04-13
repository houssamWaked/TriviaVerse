/**
 * User stats repository (`user_stats` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type UserStatsRow = {
  user_id: string;
  xp_total: number | null;
  level: number | null;
  streak_days: number | null;
  last_active_at: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields = 'user_id, xp_total, level, streak_days, last_active_at';
const mapStatsRow = (row: unknown): UserStatsRow => row as unknown as UserStatsRow;

/**
 * Repository for reading/writing `user_stats` rows.
 */
export class UserStatsRepository {
  /**
   * List stats rows for a set of user ids.
   * @param userIds User ids.
   * @returns Array of stats rows.
   */
  async listByUserIds(userIds: string[] = []): Promise<UserStatsRow[]> {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase.from('user_stats').select(selectFields).in('user_id', ids);
    if (error) throw toAppError(error);
    return (data || []).map(mapStatsRow);
  }

  /**
   * Create a default stats row for a user.
   * @param userId User id.
   * @returns `true` on success.
   */
  async createDefault(userId: string): Promise<true> {
    const { error } = await supabase.from('user_stats').insert({ user_id: userId });
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Find a stats row by user id.
   * @param userId User id.
   * @returns Stats row or `null`.
   */
  async findByUserId(userId: string): Promise<UserStatsRow | null> {
    const { data, error } = await supabase.from('user_stats').select(selectFields).eq('user_id', userId).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStatsRow(data[0]) : null;
  }

  /**
   * Add XP to a user and recompute level (best-effort level formula).
   * @param userId User id.
   * @param xpDelta Non-negative XP delta.
   * @returns Updated stats row or `null`.
   */
  async addXp(userId: string, xpDelta: number): Promise<UserStatsRow | null> {
    const current = await this.findByUserId(userId);
    const nextXp = (current?.xp_total ?? 0) + Math.max(0, Number(xpDelta) || 0);
    const nextLevel = Math.max(1, Math.floor(nextXp / 1000) + 1);
    const { data, error } = await supabase
      .from('user_stats')
      .update({ xp_total: nextXp, level: nextLevel, last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStatsRow(data[0]) : null;
  }

  /**
   * Reset a user's progress to level 1 and zero totals.
   * @param userId User id.
   * @returns Updated stats row or `null`.
   */
  async resetProgress(userId: string): Promise<UserStatsRow | null> {
    const uid = String(userId || '').trim();
    if (!uid) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_stats')
      .upsert(
        { user_id: uid, xp_total: 0, level: 1, streak_days: 0, last_active_at: now },
        { onConflict: 'user_id' }
      )
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStatsRow(data[0]) : null;
  }
}
