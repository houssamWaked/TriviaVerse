/**
 * Leaderboard repository (`leaderboard_entries` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
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

  async insertFromSession({ user_id, mode, score_value }) {
    const { error } = await supabase.from('leaderboard_entries').insert({
      user_id,
      mode,
      score_value,
      period: 'all_time',
    });
    if (error) throw toAppError(error);
    return true;
  }
}

