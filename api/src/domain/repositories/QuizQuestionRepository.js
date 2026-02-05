/**
 * Quiz question repository (`quiz_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizQuestionRepository {
  async countAll() {
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listByQuizId(quizId) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(payload)
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async update(id, patch) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(patch)
      .eq('id', id)
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async delete(id) {
    const { error, count } = await supabase
      .from('quiz_questions')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async listRandom(limit) {
    const cap = Math.min(200, Math.max(1, limit * 5));
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .limit(cap);
    if (error) throw toAppError(error);

    const rows = data || [];
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(limit, rows.length));
  }
}

