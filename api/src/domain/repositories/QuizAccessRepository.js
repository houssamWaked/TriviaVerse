/**
 * Quiz access repository (`quiz_access` table).
 *
 * Stores which users can view a private quiz (in addition to the owner).
 *
 * Expected schema:
 * - quiz_id (uuid)
 * - user_id (uuid)
 * - created_at (timestamptz, default now())
 *
 * Expected unique constraint:
 * - (quiz_id, user_id)
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Access already exists', 409, 'DUPLICATE');
  if (code === '42P01') {
    return new AppError('Quiz access table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizAccessRepository {
  async listQuizIdsForUser(userId) {
    const { data, error } = await supabase
      .from('quiz_access')
      .select('quiz_id')
      .eq('user_id', userId);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_id).filter(Boolean);
  }

  async listByQuizId(quizId) {
    const { data, error } = await supabase
      .from('quiz_access')
      .select('quiz_id, user_id, created_at')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return data || [];
  }

  async add({ quiz_id, user_id }) {
    const { data, error } = await supabase
      .from('quiz_access')
      .insert({ quiz_id, user_id })
      .select('quiz_id, user_id, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async remove({ quiz_id, user_id }) {
    const { error, count } = await supabase
      .from('quiz_access')
      .delete({ count: 'exact' })
      .eq('quiz_id', quiz_id)
      .eq('user_id', user_id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async deleteByQuizId(quizId) {
    const { error } = await supabase.from('quiz_access').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
