/**
 * Leaderboard repository (`leaderboard_entries` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Leaderboard entries table is not configured', 501, 'NOT_CONFIGURED');
  }
  if (code === '42P10') {
    return new AppError(
      'Leaderboard entries table schema mismatch: missing unique constraint on (user_id, period, mode). Apply `TriviaVerse/api/sql/leaderboard_entries_fix.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class LeaderboardRepository {
  async list({ period, mode, limit = 50 }) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('rank_position, user_id, score_value, period, mode')
      .eq('period', period)
      .eq('mode', mode)
      .order('rank_position', { ascending: true, nullsFirst: false })
      .order('score_value', { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByUserPeriodMode({ user_id, period, mode }) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('user_id, period, mode, score_value')
      .eq('user_id', user_id)
      .eq('period', period)
      .eq('mode', mode)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async insertFromSession({ user_id, mode, score_value }) {
    const period = 'all_time';
    const score = Math.max(0, Number(score_value) || 0);

    const existing = await this.findByUserPeriodMode({ user_id, period, mode });
    if (existing && (Number(existing.score_value) || 0) >= score) return existing;

    // Preferred schema: unique(user_id, period, mode)
    // Legacy schema (bug): unique(user_id, period) which prevents storing both per-mode and global rows.
    // Fallback behavior for legacy schema: only store `global` rows so gameplay doesn't break.
    {
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .upsert(
          { user_id, period, mode, score_value: score },
          { onConflict: 'user_id,period,mode' }
        )
        .select('user_id, period, mode, score_value')
        .limit(1);

      if (!error) return data?.[0] || null;

      const code = String(error.code || '').trim();
      if (code !== '42P10') throw toAppError(error);
    }

    // Schema mismatch fallback: skip non-global rows (can't be stored alongside global).
    if (mode !== 'global') return null;

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .upsert({ user_id, period, mode, score_value: score }, { onConflict: 'user_id,period' })
      .select('user_id, period, mode, score_value')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
