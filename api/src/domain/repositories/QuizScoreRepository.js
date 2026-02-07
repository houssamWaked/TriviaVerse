/**
 * Custom quiz scores repository (`quiz_scores` table).
 *
 * Stores each user's best score per quiz.
 *
 * Expected schema:
 * - quiz_id (uuid)
 * - user_id (uuid)
 * - best_score (int)
 * - created_at (timestamptz, default now())
 * - updated_at (timestamptz, default now())
 *
 * Expected unique constraint:
 * - (quiz_id, user_id)
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Quiz scores table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizScoreRepository {
  async findByQuizAndUser(quizId, userId) {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, created_at, updated_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async upsertBest({ quiz_id, user_id, score_value }) {
    const score = Math.max(0, Number(score_value) || 0);
    const existing = await this.findByQuizAndUser(quiz_id, user_id);
    if (existing && (Number(existing.best_score) || 0) >= score) return existing;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('quiz_scores')
      .upsert(
        { quiz_id, user_id, best_score: score, updated_at: now },
        { onConflict: 'quiz_id,user_id' }
      )
      .select('quiz_id, user_id, best_score, created_at, updated_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listTopByQuizId(quizId, limit = 20) {
    const lim = Math.min(100, Math.max(1, Number(limit) || 20));
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, updated_at')
      .eq('quiz_id', quizId)
      .order('best_score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listByUserId(userId, limit = 100) {
    const lim = Math.min(200, Math.max(1, Number(limit) || 100));
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return data || [];
  }

  async deleteByQuizId(quizId) {
    const { error } = await supabase.from('quiz_scores').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
