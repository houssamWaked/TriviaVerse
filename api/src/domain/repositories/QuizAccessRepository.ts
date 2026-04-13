/**
 * Quiz access repository (`quiz_access` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizAccessRow = {
  quiz_id: string;
  user_id: string;
  created_at: string | null;
};

type QuizAccessInput = Pick<QuizAccessRow, 'quiz_id' | 'user_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Access already exists', 409, 'DUPLICATE');
  if (code === '42P01') {
    return new AppError('Quiz access table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields = 'quiz_id, user_id, created_at';
const mapAccessRow = (row: unknown): QuizAccessRow => row as unknown as QuizAccessRow;

/**
 * Repository for explicit private quiz access allow-lists (`quiz_access`).
 */
export class QuizAccessRepository {
  /**
   * List quiz ids a user is allowed to access.
   * @param userId User id.
   * @returns Array of quiz ids.
   */
  async listQuizIdsForUser(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from('quiz_access').select('quiz_id').eq('user_id', userId);
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as { quiz_id?: string }).quiz_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * List access rows for a quiz.
   * @param quizId Quiz id.
   * @returns Array of access rows ordered by newest first.
   */
  async listByQuizId(quizId: string): Promise<QuizAccessRow[]> {
    const { data, error } = await supabase
      .from('quiz_access')
      .select(selectFields)
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return (data || []).map(mapAccessRow);
  }

  /**
   * Add an access row.
   * @param quiz_id Quiz id.
   * @param user_id User id.
   * @returns Created access row or `null`.
   */
  async add({ quiz_id, user_id }: QuizAccessInput): Promise<QuizAccessRow | null> {
    const { data, error } = await supabase
      .from('quiz_access')
      .insert({ quiz_id, user_id })
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapAccessRow(data[0]) : null;
  }

  /**
   * Remove an access row.
   * @param quiz_id Quiz id.
   * @param user_id User id.
   * @returns `true` if a row was deleted.
   */
  async remove({ quiz_id, user_id }: QuizAccessInput): Promise<boolean> {
    const { error, count } = await supabase
      .from('quiz_access')
      .delete({ count: 'exact' })
      .eq('quiz_id', quiz_id)
      .eq('user_id', user_id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * Delete all access rows for a quiz.
   * @param quizId Quiz id.
   * @returns `true` on success.
   */
  async deleteByQuizId(quizId: string): Promise<true> {
    const { error } = await supabase.from('quiz_access').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
