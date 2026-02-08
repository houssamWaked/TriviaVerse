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
  selectFields =
    'id, user_id, level_id, best_score, stars_earned, attempts_count, is_unlocked, is_completed, last_played_at';

  async listByUserId(userId) {
    const { data, error } = await supabase
      .from('user_story_progress')
      .select(this.selectFields)
      .eq('user_id', userId);
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByUserAndLevelId(userId, levelId) {
    const { data, error } = await supabase
      .from('user_story_progress')
      .select(this.selectFields)
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async upsertByUserAndLevelId(userId, levelId, patch = {}) {
    const payload = {
      user_id: userId,
      level_id: levelId,
      ...patch,
    };

    const { data, error } = await supabase
      .from('user_story_progress')
      .upsert(payload, { onConflict: 'user_id,level_id' })
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async ensureUnlocked(userId, levelId) {
    return await this.upsertByUserAndLevelId(userId, levelId, { is_unlocked: true });
  }

  async upsertResult(userId, levelId, { score_total = 0, stars_earned = 0, is_completed }) {
    const existing = await this.findByUserAndLevelId(userId, levelId);

    const best_score = Math.max(existing?.best_score ?? 0, Math.max(0, Number(score_total) || 0));
    const best_stars = Math.max(existing?.stars_earned ?? 0, Math.max(0, Number(stars_earned) || 0));
    const completed = Boolean(existing?.is_completed) || Boolean(is_completed);

    return await this.upsertByUserAndLevelId(userId, levelId, {
      is_unlocked: true,
      is_completed: completed,
      best_score,
      stars_earned: best_stars,
      last_played_at: new Date().toISOString(),
    });
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
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async deleteByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return true;

    const { error } = await supabase.from('user_story_progress').delete().eq('level_id', lid);
    if (error) throw toAppError(error);
    return true;
  }
}
