/**
 * Quiz ratings repository (`quiz_ratings` table).
 *
 * Expected schema:
 * - quiz_id (uuid)
 * - user_id (uuid)
 * - rating (int, 1..5)
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
    return new AppError('Ratings table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizRatingRepository {
  async upsert({ quiz_id, user_id, rating }) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('quiz_ratings')
      .upsert(
        { quiz_id, user_id, rating, updated_at: now },
        { onConflict: 'quiz_id,user_id' }
      )
      .select('quiz_id, user_id, rating')
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async getUserRating(quizId, userId) {
    const { data, error } = await supabase
      .from('quiz_ratings')
      .select('quiz_id, user_id, rating')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listByQuizIds(quizIds = []) {
    const unique = Array.from(new Set((quizIds || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const { data, error } = await supabase
      .from('quiz_ratings')
      .select('quiz_id, rating')
      .in('quiz_id', unique);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listByQuizId(quizId) {
    const { data, error } = await supabase
      .from('quiz_ratings')
      .select('quiz_id, rating')
      .eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return data || [];
  }

  async deleteByQuizId(quizId) {
    const { error } = await supabase.from('quiz_ratings').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
