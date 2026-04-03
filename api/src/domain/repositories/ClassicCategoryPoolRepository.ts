/**
 * Classic category pool repository (`classic_category_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type ClassicCategoryPoolRow = {
  category_id: string;
  quiz_question_id: string;
  created_at?: string | null;
};

type CategoryAssignmentRow = Pick<ClassicCategoryPoolRow, 'category_id' | 'quiz_question_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Classic category pool table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const uniqueIds = (values: string[] = []): string[] => Array.from(new Set(values.filter(Boolean)));

export class ClassicCategoryPoolRepository {
  async listAllQuestionIds(): Promise<string[]> {
    const pageSize = 1000;
    const ids: string[] = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      const { data, error } = await supabase
        .from('classic_category_pool')
        .select('quiz_question_id')
        .order('created_at', { ascending: false })
        .order('quiz_question_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw toAppError(error);
      const page = (data || [])
        .map((row) => (row as Partial<ClassicCategoryPoolRow>).quiz_question_id)
        .filter((value): value is string => Boolean(value));
      ids.push(...page);
      if (page.length < pageSize) break;
    }

    return ids;
  }

  async listAssignmentsByQuestionIds(questionIds: string[] = []): Promise<CategoryAssignmentRow[]> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('category_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return (data || []) as CategoryAssignmentRow[];
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return 0;

    const { count, error } = await supabase
      .from('classic_category_pool')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', normalizedCategoryId);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listQuestionIdsByCategoryId(categoryId: string): Promise<string[]> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return [];

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('quiz_question_id')
      .eq('category_id', normalizedCategoryId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ClassicCategoryPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  async listQuestionIdsByCategoryIdPaged(
    categoryId: string,
    { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
  ): Promise<string[]> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return [];

    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const normalizedOffset = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('quiz_question_id')
      .eq('category_id', normalizedCategoryId)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(normalizedOffset, normalizedOffset + normalizedLimit - 1);
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as Partial<ClassicCategoryPoolRow>).quiz_question_id)
      .filter((value): value is string => Boolean(value));
  }

  async upsertMany(categoryId: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedCategoryId = String(categoryId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedCategoryId || ids.length === 0) return true;

    const createdAt = new Date().toISOString();
    const rows: ClassicCategoryPoolRow[] = ids.map((id) => ({
      category_id: normalizedCategoryId,
      quiz_question_id: id,
      created_at: createdAt,
    }));

    const { error } = await supabase
      .from('classic_category_pool')
      .upsert(rows, { onConflict: 'category_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  async deleteMany(categoryId: string, questionIds: string[] = []): Promise<boolean> {
    const normalizedCategoryId = String(categoryId || '').trim();
    const ids = uniqueIds(questionIds);
    if (!normalizedCategoryId || ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_pool')
      .delete()
      .eq('category_id', normalizedCategoryId)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteAllByCategoryId(categoryId: string): Promise<boolean> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return true;

    const { error } = await supabase
      .from('classic_category_pool')
      .delete()
      .eq('category_id', normalizedCategoryId);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuizQuestionIds(questionIds: string[] = []): Promise<boolean> {
    const ids = uniqueIds(questionIds);
    if (ids.length === 0) return true;

    const { error } = await supabase.from('classic_category_pool').delete().in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
