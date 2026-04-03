/**
 * Duel answers repository (`duel_answers` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type DuelAnswerRow = {
  id: string;
  duel_id: string;
  user_id: string;
  question_index: number;
  session_option_id: string;
  is_correct: boolean;
  answered_ms: number | null;
  created_at: string | null;
};

type CreateDuelAnswerInput = Omit<DuelAnswerRow, 'id' | 'created_at'> & { id?: string; created_at?: string | null };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Duel answers table is not configured. Apply `TriviaVerse/api/sql/duels.sql`.', 501, 'NOT_CONFIGURED');
  }
  if (code === '23505') return new AppError('Already answered', 409, 'CONFLICT');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapDuelAnswerRow = (row: unknown): DuelAnswerRow => row as unknown as DuelAnswerRow;

export class DuelAnswerRepository {
  selectFields =
    'id, duel_id, user_id, question_index, session_option_id, is_correct, answered_ms, created_at';

  async create(payload: CreateDuelAnswerInput): Promise<DuelAnswerRow | null> {
    const { data, error } = await supabase.from('duel_answers').insert(payload).select(this.selectFields).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapDuelAnswerRow(data[0]) : null;
  }

  async listByDuelAndQuestionIndex(duelId: string, questionIndex: number): Promise<DuelAnswerRow[]> {
    const { data, error } = await supabase
      .from('duel_answers')
      .select(this.selectFields)
      .eq('duel_id', duelId)
      .eq('question_index', questionIndex);
    if (error) throw toAppError(error);
    return (data || []).map(mapDuelAnswerRow);
  }

  async listByDuelId(duelId: string, limit = 200): Promise<DuelAnswerRow[]> {
    const lim = Math.min(500, Math.max(1, Number(limit) || 200));
    const { data, error } = await supabase
      .from('duel_answers')
      .select(this.selectFields)
      .eq('duel_id', duelId)
      .order('question_index', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(lim);
    if (error) throw toAppError(error);
    return (data || []).map(mapDuelAnswerRow);
  }
}
