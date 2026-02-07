/**
 * Game session repository (`game_sessions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class GameSessionRepository {
  /**
   * Count distinct players with at least one session.
   *
   * Note: Supabase query builder does not expose COUNT(DISTINCT ...) directly,
   * so we compute the distinct set in JS.
   */
  async countDistinctActivePlayers() {
    const { data, error } = await supabase.from('game_sessions').select('user_id');
    if (error) throw toAppError(error);

    const ids = new Set((data || []).map((r) => r.user_id).filter(Boolean));
    return ids.size;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(payload)
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ status, ended_at: new Date().toISOString() })
      .eq('id', id)
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async addScore(id, scoreDelta) {
    const current = await this.findById(id);
    if (!current) return null;

    const nextScore = (current.score_total ?? 0) + Math.max(0, scoreDelta || 0);
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ score_total: nextScore })
      .eq('id', id)
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async setScore(id, scoreTotal) {
    const nextScore = Math.max(0, Number(scoreTotal) || 0);
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ score_total: nextScore })
      .eq('id', id)
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async clearQuizIdForQuiz(quizId) {
    const { error } = await supabase
      .from('game_sessions')
      .update({ quiz_id: null })
      .eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }

  async listByUserId(userId, limit = 200) {
    const lim = Math.min(1000, Math.max(1, Number(limit) || 200));
    const { data, error } = await supabase
      .from('game_sessions')
      .select(
        'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status'
      )
      .eq('user_id', userId)
      .order('ended_at', { ascending: false, nullsFirst: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return data || [];
  }
}
