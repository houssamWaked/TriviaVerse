/**
 * Session answer repository (`session_answers` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Already answered', 409, 'CONFLICT');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class SessionAnswerRepository {
  async findBySessionQuestionId(sessionQuestionId) {
    const { data, error } = await supabase
      .from('session_answers')
      .select('id, session_question_id, chosen_option_id, is_correct, answered_in_sec, answered_at')
      .eq('session_question_id', sessionQuestionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listBySessionQuestionIds(sessionQuestionIds = []) {
    const ids = (sessionQuestionIds || []).filter(Boolean);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('session_answers')
      .select('id, session_question_id, chosen_option_id, is_correct, answered_in_sec, answered_at')
      .in('session_question_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('session_answers')
      .insert(payload)
      .select('id, session_question_id, chosen_option_id, is_correct, answered_in_sec, answered_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
