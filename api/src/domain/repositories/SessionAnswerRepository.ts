/**
 * Session answer repository (`session_answers` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type SessionAnswerRow = {
  id: string;
  session_question_id: string;
  chosen_option_id: string;
  is_correct: boolean;
  answered_in_sec: number | null;
  answered_at: string | null;
};

type CreateSessionAnswerInput = Omit<SessionAnswerRow, 'id' | 'answered_at'> & { id?: string; answered_at?: string | null };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Already answered', 409, 'CONFLICT');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, session_question_id, chosen_option_id, is_correct, answered_in_sec, answered_at';
const mapSessionAnswerRow = (row: unknown): SessionAnswerRow => row as unknown as SessionAnswerRow;

/**
 * Repository for reading/writing `session_answers` rows.
 */
export class SessionAnswerRepository {
  /**
   * Find an answer row for a session question.
   * @param sessionQuestionId Session question id.
   * @returns Answer row or `null`.
   */
  async findBySessionQuestionId(sessionQuestionId: string): Promise<SessionAnswerRow | null> {
    const { data, error } = await supabase
      .from('session_answers')
      .select(selectFields)
      .eq('session_question_id', sessionQuestionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionAnswerRow(data[0]) : null;
  }

  /**
   * List answer rows for a set of session question ids.
   * @param sessionQuestionIds Session question ids.
   * @returns Array of answer rows.
   */
  async listBySessionQuestionIds(sessionQuestionIds: string[] = []): Promise<SessionAnswerRow[]> {
    const ids = sessionQuestionIds.filter(Boolean);
    if (ids.length === 0) return [];

    const { data, error } = await supabase.from('session_answers').select(selectFields).in('session_question_id', ids);
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionAnswerRow);
  }

  /**
   * Create an answer row for a session question.
   * @param payload Insert payload.
   * @returns Created answer row or `null`.
   */
  async create(payload: CreateSessionAnswerInput): Promise<SessionAnswerRow | null> {
    const { data, error } = await supabase.from('session_answers').insert(payload).select(selectFields).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionAnswerRow(data[0]) : null;
  }
}
