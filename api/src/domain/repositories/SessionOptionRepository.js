/**
 * Session option repository (`session_options` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class SessionOptionRepository {
  async listBySessionQuestionId(sessionQuestionId) {
    const { data, error } = await supabase
      .from('session_options')
      .select(
        'id, session_question_id, option_text_snapshot, is_correct_snapshot, order_index'
      )
      .eq('session_question_id', sessionQuestionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async listBySessionQuestionIds(sessionQuestionIds = []) {
    const ids = Array.from(new Set((sessionQuestionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('session_options')
      .select('id, session_question_id, option_text_snapshot, is_correct_snapshot, order_index')
      .in('session_question_id', ids)
      .order('session_question_id', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async createMany(rows) {
    const { data, error } = await supabase
      .from('session_options')
      .insert(rows)
      .select(
        'id, session_question_id, option_text_snapshot, is_correct_snapshot, order_index'
      );
    if (error) throw toAppError(error);
    return data || [];
  }
}
