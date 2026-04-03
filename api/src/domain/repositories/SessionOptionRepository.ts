/**
 * Session option repository (`session_options` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type SessionOptionRow = {
  id: string;
  session_question_id: string;
  option_text_snapshot: string;
  is_correct_snapshot: boolean;
  order_index: number | null;
};

type CreateSessionOptionInput = Omit<SessionOptionRow, 'id'> & { id?: string };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, session_question_id, option_text_snapshot, is_correct_snapshot, order_index';
const mapSessionOptionRow = (row: unknown): SessionOptionRow => row as unknown as SessionOptionRow;

export class SessionOptionRepository {
  async listBySessionQuestionId(sessionQuestionId: string): Promise<SessionOptionRow[]> {
    const { data, error } = await supabase
      .from('session_options')
      .select(selectFields)
      .eq('session_question_id', sessionQuestionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionOptionRow);
  }

  async listBySessionQuestionIds(sessionQuestionIds: string[] = []): Promise<SessionOptionRow[]> {
    const ids = Array.from(new Set(sessionQuestionIds.filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('session_options')
      .select(selectFields)
      .in('session_question_id', ids)
      .order('session_question_id', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionOptionRow);
  }

  async createMany(rows: CreateSessionOptionInput[]): Promise<SessionOptionRow[]> {
    const { data, error } = await supabase.from('session_options').insert(rows).select(selectFields);
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionOptionRow);
  }
}
