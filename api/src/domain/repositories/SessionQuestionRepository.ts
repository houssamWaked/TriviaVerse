/**
 * Session question repository (`session_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type SessionQuestionRow = {
  id: string;
  session_id: string;
  source_question_id: string | null;
  question_text_snapshot: string;
  order_index: number | null;
  points_snapshot: number | null;
  time_limit_snapshot: number | null;
};

type CreateSessionQuestionInput = Omit<SessionQuestionRow, 'id'> & { id?: string };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, session_id, source_question_id, question_text_snapshot, order_index, points_snapshot, time_limit_snapshot';
const mapSessionQuestionRow = (row: unknown): SessionQuestionRow => row as unknown as SessionQuestionRow;

export class SessionQuestionRepository {
  async listBySessionId(sessionId: string): Promise<SessionQuestionRow[]> {
    const { data, error } = await supabase
      .from('session_questions')
      .select(selectFields)
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionQuestionRow);
  }

  async getMaxOrderIndex(sessionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('session_questions')
      .select('order_index')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return Number((data?.[0] as { order_index?: number } | undefined)?.order_index) || 0;
  }

  async createMany(rows: CreateSessionQuestionInput[]): Promise<SessionQuestionRow[]> {
    const { data, error } = await supabase.from('session_questions').insert(rows).select(selectFields);
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionQuestionRow);
  }

  async clearSourceQuestionIds(questionIds: string[] = []): Promise<true> {
    const ids = Array.from(new Set(questionIds.filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase.from('session_questions').update({ source_question_id: null }).in('source_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
