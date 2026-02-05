/**
 * User story progress repository (`user_story_progress` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class UserStoryProgressRepository {
  async listByUserId(userId) {
    const { data, error } = await supabase
      .from('user_story_progress')
      .select(
        'id, user_id, level_id, best_score, stars_earned, attempts_count, is_unlocked, is_completed, last_played_at'
      )
      .eq('user_id', userId);
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByUserAndLevelId(userId, levelId) {
    const { data, error } = await supabase
      .from('user_story_progress')
      .select(
        'id, user_id, level_id, best_score, stars_earned, attempts_count, is_unlocked, is_completed, last_played_at'
      )
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async bumpAttempts(progressId) {
    const { data: current, error: readError } = await supabase
      .from('user_story_progress')
      .select('id, attempts_count')
      .eq('id', progressId)
      .limit(1);
    if (readError) throw toAppError(readError);
    const attempts = (current?.[0]?.attempts_count ?? 0) + 1;

    const { data, error } = await supabase
      .from('user_story_progress')
      .update({
        attempts_count: attempts,
        last_played_at: new Date().toISOString(),
      })
      .eq('id', progressId)
      .select(
        'id, user_id, level_id, best_score, stars_earned, attempts_count, is_unlocked, is_completed, last_played_at'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}

