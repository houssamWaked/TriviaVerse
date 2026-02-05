/**
 * Session question repository (`session_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class SessionQuestionRepository {
  async listBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('session_questions')
      .select(
        'id, session_id, source_question_id, question_text_snapshot, order_index, points_snapshot, time_limit_snapshot'
      )
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async createMany(rows) {
    const { data, error } = await supabase
      .from('session_questions')
      .insert(rows)
      .select(
        'id, session_id, source_question_id, question_text_snapshot, order_index, points_snapshot, time_limit_snapshot'
      );
    if (error) throw toAppError(error);
    return data || [];
  }
}

