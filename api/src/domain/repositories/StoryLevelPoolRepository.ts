/**
 * Story level pool repository (`story_level_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type StoryLevelPoolRow = {
  level_id: string;
  quiz_question_id: string;
};

type StoryLevelPoolAssignment = Pick<StoryLevelPoolRow, 'level_id' | 'quiz_question_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Story level pool table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const uniqueIds = (values: string[] = []): string[] => Array.from(new Set(values.filter(Boolean)));

/**
 * Repository for mapping story levels to global question ids (`story_level_pool`).
 */
export class StoryLevelPoolRepository {
  /**
   * List all question ids included in any story pool (paged query).
   * @returns Array of quiz question ids.
   */
  async listAllQuestionIds(): Promise<string[]> {
    const pageSize = 1000;
    const ids: string[] = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      let res = await supabase
        .from('story_level_pool')
        .select('quiz_question_id')
        .order('created_at', { ascending: false })
        .order('quiz_question_id', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (res.error && String(res.error.code || '').trim() === '42703') {
        res = await supabase
          .from('story_level_pool')
          .select('quiz_question_id')
          .order('quiz_question_id', { ascending: true })
          .range(offset, offset + pageSize - 1);
      }

      const { data, error } = res;
      if (error) throw toAppError(error);
      const page = (data || [])
        .map((row) => (row as { quiz_question_id?: string }).quiz_question_id)
        .filter((value): value is string => Boolean(value));
      ids.push(...page);
      if (page.length < pageSize) break;
    }

    return ids;
  }

  /**
   * List level assignments for a set of question ids.
   * @param questionIds Quiz question ids.
   * @returns Array of `{ level_id, quiz_question_id }` rows.
   */
  async listAssignmentsByQuestionIds(questionIds: string[] = []): Promise<StoryLevelPoolAssignment[]> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('story_level_pool')
      .select('level_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return (data || []) as StoryLevelPoolAssignment[];
  }

  /**
   * List question ids assigned to a level.
   * @param levelId Story level id.
   * @returns Array of quiz question ids.
   */
  async listQuestionIdsByLevelId(levelId: string): Promise<string[]> {
    let res = await supabase
      .from('story_level_pool')
      .select('quiz_question_id')
      .eq('level_id', levelId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });

    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('story_level_pool')
        .select('quiz_question_id')
        .eq('level_id', levelId)
        .order('quiz_question_id', { ascending: true });
    }

    if (res.error) throw toAppError(res.error);
    return (res.data || [])
      .map((row) => (row as { quiz_question_id?: string }).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * List question ids assigned to a level with pagination.
   * @param levelId Story level id.
   * @param limit Page size.
   * @param offset Page offset.
   * @returns Array of quiz question ids.
   */
  async listQuestionIdsByLevelIdPaged(
    levelId: string,
    { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
  ): Promise<string[]> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return [];

    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    let res = await supabase
      .from('story_level_pool')
      .select('quiz_question_id')
      .eq('level_id', normalizedLevelId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(off, off + lim - 1);

    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('story_level_pool')
        .select('quiz_question_id')
        .eq('level_id', normalizedLevelId)
        .order('quiz_question_id', { ascending: true })
        .range(off, off + lim - 1);
    }

    if (res.error) throw toAppError(res.error);
    return (res.data || [])
      .map((row) => (row as { quiz_question_id?: string }).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Upsert level -> question assignments.
   * @param levelId Story level id.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async upsertMany(levelId: string, questionIds: string[] = []): Promise<true> {
    const normalizedLevelId = String(levelId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedLevelId || ids.length === 0) return true;

    const rows: StoryLevelPoolRow[] = ids.map((quizQuestionId) => ({
      level_id: normalizedLevelId,
      quiz_question_id: quizQuestionId,
    }));
    const { error } = await supabase
      .from('story_level_pool')
      .upsert(rows, { onConflict: 'level_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete a set of level -> question assignments.
   * @param levelId Story level id.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteMany(levelId: string, questionIds: string[] = []): Promise<true> {
    const normalizedLevelId = String(levelId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedLevelId || ids.length === 0) return true;

    const { error } = await supabase
      .from('story_level_pool')
      .delete()
      .eq('level_id', normalizedLevelId)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete all assignments for a level.
   * @param levelId Story level id.
   * @returns `true` on success.
   */
  async deleteAllByLevelId(levelId: string): Promise<true> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return true;

    const { error } = await supabase.from('story_level_pool').delete().eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete assignments for a set of quiz question ids (across all levels).
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteByQuizQuestionIds(questionIds: string[] = []): Promise<true> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return true;

    const { error } = await supabase.from('story_level_pool').delete().in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
