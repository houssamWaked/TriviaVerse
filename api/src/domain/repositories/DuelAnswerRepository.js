/**
 * Duel answers repository (`duel_answers` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Duel answers table is not configured. Apply `TriviaVerse/api/sql/duels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '23505') return new AppError('Already answered', 409, 'CONFLICT');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class DuelAnswerRepository {
  selectFields =
    'id, duel_id, user_id, question_index, session_option_id, is_correct, answered_ms, created_at';

  async create(payload) {
    const { data, error } = await supabase
      .from('duel_answers')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listByDuelAndQuestionIndex(duelId, questionIndex) {
    const { data, error } = await supabase
      .from('duel_answers')
      .select(this.selectFields)
      .eq('duel_id', duelId)
      .eq('question_index', questionIndex);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listByDuelId(duelId, limit = 200) {
    const lim = Math.min(500, Math.max(1, Number(limit) || 200));
    const { data, error } = await supabase
      .from('duel_answers')
      .select(this.selectFields)
      .eq('duel_id', duelId)
      .order('question_index', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(lim);
    if (error) throw toAppError(error);
    return data || [];
  }
}
