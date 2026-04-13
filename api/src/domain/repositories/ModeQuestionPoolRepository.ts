/**
 * Mode question pool repository (`mode_question_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type ModeValue = 'classic' | 'blitz' | 'millionaire' | string;

type ModeQuestionPoolRow = {
  mode: ModeValue;
  quiz_question_id: string;
  created_at?: string | null;
};

type ModeAssignmentRow = Pick<ModeQuestionPoolRow, 'mode' | 'quiz_question_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Mode question pool table is not configured. Apply `TriviaVerse/api/sql/004_mode_question_pool.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const uniqueIds = (values: string[] = []): string[] => Array.from(new Set(values.filter(Boolean)));
const normalizeMode = (mode: unknown): string => String(mode || '').trim().toLowerCase();

/**
 * Repository for mapping modes to global question ids (`mode_question_pool`).
 */
export class ModeQuestionPoolRepository {
  /**
   * List all question ids included in any mode pool (paged query).
   * @returns Array of quiz question ids.
   */
  async listAllQuestionIds(): Promise<string[]> {
    const pageSize = 1000;
    const ids: string[] = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      const { data, error } = await supabase
        .from('mode_question_pool')
        .select('quiz_question_id')
        .order('created_at', { ascending: false })
        .order('quiz_question_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw toAppError(error);
      const page = (data || [])
        .map((row) => (row as Partial<ModeQuestionPoolRow>).quiz_question_id)
        .filter((value): value is string => Boolean(value));
      ids.push(...page);
      if (page.length < pageSize) break;
    }

    return ids;
  }

  /**
   * List mode assignments for a set of question ids.
   * @param questionIds Quiz question ids.
   * @returns Array of `{ mode, quiz_question_id }` rows.
   */
  async listAssignmentsByQuestionIds(questionIds: string[] = []): Promise<ModeAssignmentRow[]> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('mode, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return (data || []) as ModeAssignmentRow[];
  }

  /**
   * List question ids assigned to a mode.
   * @param mode Mode name.
   * @returns Array of quiz question ids.
   */
  async listQuestionIdsByMode(mode: string): Promise<string[]> {
    const normalizedMode = normalizeMode(mode);
    if (!normalizedMode) return [];

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('quiz_question_id')
      .eq('mode', normalizedMode)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ModeQuestionPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * List question ids assigned to a mode with pagination.
   * @param mode Mode name.
   * @param limit Page size.
   * @param offset Page offset.
   * @returns Array of quiz question ids.
   */
  async listQuestionIdsByModePaged(
    mode: string,
    { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
  ): Promise<string[]> {
    const normalizedMode = normalizeMode(mode);
    if (!normalizedMode) return [];

    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const normalizedOffset = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('quiz_question_id')
      .eq('mode', normalizedMode)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);

    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ModeQuestionPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Upsert mode -> question assignments.
   * @param mode Mode name.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async upsertMany(mode: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedMode = normalizeMode(mode);
    const ids = uniqueIds(questionIds);
    if (!normalizedMode || ids.length === 0) return true;

    const createdAt = new Date().toISOString();
    const rows: ModeQuestionPoolRow[] = ids.map((id) => ({
      mode: normalizedMode,
      quiz_question_id: id,
      created_at: createdAt,
    }));

    const { error } = await supabase
      .from('mode_question_pool')
      .upsert(rows, { onConflict: 'mode,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete a set of mode -> question assignments.
   * @param mode Mode name.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteMany(mode: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedMode = normalizeMode(mode);
    const ids = uniqueIds(questionIds);
    if (!normalizedMode || ids.length === 0) return true;

    const { error } = await supabase
      .from('mode_question_pool')
      .delete()
      .eq('mode', normalizedMode)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete all assignments for a mode.
   * @param mode Mode name.
   * @returns `true` on success.
   */
  async deleteAllByMode(mode: string): Promise<boolean> {
    const normalizedMode = normalizeMode(mode);
    if (!normalizedMode) return true;

    const { error } = await supabase.from('mode_question_pool').delete().eq('mode', normalizedMode);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete assignments for a set of quiz question ids (across all modes).
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteByQuizQuestionIds(questionIds: string[] = []): Promise<boolean> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return true;

    const { error } = await supabase.from('mode_question_pool').delete().in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
