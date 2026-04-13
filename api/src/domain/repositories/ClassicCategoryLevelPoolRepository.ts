/**
 * Classic category level pool repository (`classic_category_level_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type ClassicCategoryLevelPoolRow = {
  level_id: string;
  quiz_question_id: string;
  created_at?: string | null;
};

type LevelAssignmentRow = Pick<ClassicCategoryLevelPoolRow, 'level_id' | 'quiz_question_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Classic category level pool table is not configured. Apply `TriviaVerse/api/sql/009_classic_category_levels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const uniqueIds = (values: string[] = []): string[] => Array.from(new Set(values.filter(Boolean)));

/**
 * Repository for mapping classic levels to global question ids (`classic_category_level_pool`).
 */
export class ClassicCategoryLevelPoolRepository {
  /**
   * Count pool rows for a set of level ids.
   * @param levelIds Level ids.
   * @returns Row count.
   */
  async countByLevelIds(levelIds: string[] = []): Promise<number> {
    const ids = uniqueIds(levelIds);
    if (ids.length === 0) return 0;

    const { count, error } = await supabase
      .from('classic_category_level_pool')
      .select('*', { count: 'exact', head: true })
      .in('level_id', ids);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  /**
   * List all question ids included in any classic level pool (paged query).
   * @returns Array of quiz question ids.
   */
  async listAllQuestionIds(): Promise<string[]> {
    const pageSize = 1000;
    const ids: string[] = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      const { data, error } = await supabase
        .from('classic_category_level_pool')
        .select('quiz_question_id')
        .order('created_at', { ascending: false })
        .order('quiz_question_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw toAppError(error);
      const page = (data || [])
        .map((row) => (row as Partial<ClassicCategoryLevelPoolRow>).quiz_question_id)
        .filter((value): value is string => Boolean(value));
      ids.push(...page);
      if (page.length < pageSize) break;
    }

    return ids;
  }

  /**
   * Count pool rows for a level id.
   * @param levelId Level id.
   * @returns Row count.
   */
  async countByLevelId(levelId: string): Promise<number> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return 0;

    const { count, error } = await supabase
      .from('classic_category_level_pool')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  /**
   * List level assignments for a set of question ids.
   * @param questionIds Quiz question ids.
   * @returns Array of `{ level_id, quiz_question_id }` rows.
   */
  async listAssignmentsByQuestionIds(questionIds: string[] = []): Promise<LevelAssignmentRow[]> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('level_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return (data || []) as LevelAssignmentRow[];
  }

  /**
   * List question ids assigned to a level.
   * @param levelId Level id.
   * @returns Array of quiz question ids.
   */
  async listQuestionIdsByLevelId(levelId: string): Promise<string[]> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return [];

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('quiz_question_id')
      .eq('level_id', normalizedLevelId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ClassicCategoryLevelPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * List question ids assigned to a level with pagination.
   * @param levelId Level id.
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

    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const normalizedOffset = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('quiz_question_id')
      .eq('level_id', normalizedLevelId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ClassicCategoryLevelPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Upsert level -> question assignments.
   * @param levelId Level id.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async upsertMany(levelId: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedLevelId = String(levelId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedLevelId || ids.length === 0) return true;

    const createdAt = new Date().toISOString();
    const rows: ClassicCategoryLevelPoolRow[] = ids.map((id) => ({
      level_id: normalizedLevelId,
      quiz_question_id: id,
      created_at: createdAt,
    }));

    const { error } = await supabase
      .from('classic_category_level_pool')
      .upsert(rows, { onConflict: 'level_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete a set of level -> question assignments.
   * @param levelId Level id.
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteMany(levelId: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedLevelId = String(levelId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedLevelId || ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_level_pool')
      .delete()
      .eq('level_id', normalizedLevelId)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete all assignments for a level.
   * @param levelId Level id.
   * @returns `true` on success.
   */
  async deleteAllByLevelId(levelId: string): Promise<boolean> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return true;

    const { error } = await supabase
      .from('classic_category_level_pool')
      .delete()
      .eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete assignments for a set of quiz question ids (across all levels).
   * @param questionIds Quiz question ids.
   * @returns `true` on success.
   */
  async deleteByQuizQuestionIds(questionIds: string[] = []): Promise<boolean> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_level_pool')
      .delete()
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
