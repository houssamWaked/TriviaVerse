/**
 * Classic category level repository (`classic_category_levels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type ClassicCategoryLevelRow = {
  id: string;
  category_id: string;
  level_number: number;
  title: string;
  difficulty_min: number | null;
  difficulty_max: number | null;
  xp_reward: number | null;
  created_at: string | null;
};

type CreateClassicCategoryLevelInput = Omit<ClassicCategoryLevelRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Classic category levels table is not configured. Apply `TriviaVerse/api/sql/009_classic_category_levels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapLevelRow = (row: unknown): ClassicCategoryLevelRow => row as unknown as ClassicCategoryLevelRow;

/**
 * Repository for classic category level definitions (`classic_category_levels`).
 */
export class ClassicCategoryLevelRepository {
  selectFields =
    'id, category_id, level_number, title, difficulty_min, difficulty_max, xp_reward, created_at';

  /**
   * List levels for a category ordered by level number.
   * @param categoryId Category id.
   * @returns Array of level rows.
   */
  async listByCategoryId(categoryId: string): Promise<ClassicCategoryLevelRow[]> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return [];

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('category_id', normalizedCategoryId)
      .order('level_number', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapLevelRow);
  }

  /**
   * Find a classic level by id.
   * @param levelId Level id.
   * @returns Level row or `null`.
   */
  async findById(levelId: string): Promise<ClassicCategoryLevelRow | null> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return null;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('id', normalizedLevelId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapLevelRow(data[0]) : null;
  }

  /**
   * Find a level by category and level number.
   * @param categoryId Category id.
   * @param levelNumber Level number.
   * @returns Level row or `null`.
   */
  async findByCategoryAndLevelNumber(
    categoryId: string,
    levelNumber: number
  ): Promise<ClassicCategoryLevelRow | null> {
    const normalizedCategoryId = String(categoryId || '').trim();
    const normalizedLevelNumber = Number(levelNumber);
    if (!normalizedCategoryId || !Number.isFinite(normalizedLevelNumber)) return null;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('category_id', normalizedCategoryId)
      .eq('level_number', Math.floor(normalizedLevelNumber))
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapLevelRow(data[0]) : null;
  }

  /**
   * Get the highest level number configured for a category.
   * @param categoryId Category id.
   * @returns Max level number (0 when none).
   */
  async getMaxLevelNumberByCategory(categoryId: string): Promise<number> {
    const normalizedCategoryId = String(categoryId || '').trim();
    if (!normalizedCategoryId) return 0;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select('level_number')
      .eq('category_id', normalizedCategoryId)
      .order('level_number', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return Number((data?.[0] as { level_number?: number } | undefined)?.level_number) || 0;
  }

  /**
   * Create a classic category level row.
   * @param payload Insert payload.
   * @returns Created level row or `null`.
   */
  async create(payload: CreateClassicCategoryLevelInput): Promise<ClassicCategoryLevelRow | null> {
    const { data, error } = await supabase
      .from('classic_category_levels')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapLevelRow(data[0]) : null;
  }

  /**
   * Delete a level by id.
   * @param levelId Level id.
   * @returns `true` if a row was deleted.
   */
  async delete(levelId: string): Promise<boolean> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return false;

    const { error, count } = await supabase
      .from('classic_category_levels')
      .delete({ count: 'exact' })
      .eq('id', normalizedLevelId);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}
