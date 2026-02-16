/**
 * Classic category level repository (`classic_category_levels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
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

export class ClassicCategoryLevelRepository {
  selectFields =
    'id, category_id, level_number, title, difficulty_min, difficulty_max, xp_reward, created_at';

  async listByCategoryId(categoryId) {
    const cid = String(categoryId || '').trim();
    if (!cid) return [];

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('category_id', cid)
      .order('level_number', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findById(levelId) {
    const id = String(levelId || '').trim();
    if (!id) return null;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findByCategoryAndLevelNumber(categoryId, levelNumber) {
    const cid = String(categoryId || '').trim();
    const n = Number(levelNumber);
    if (!cid || !Number.isFinite(n)) return null;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select(this.selectFields)
      .eq('category_id', cid)
      .eq('level_number', Math.floor(n))
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async getMaxLevelNumberByCategory(categoryId) {
    const cid = String(categoryId || '').trim();
    if (!cid) return 0;

    const { data, error } = await supabase
      .from('classic_category_levels')
      .select('level_number')
      .eq('category_id', cid)
      .order('level_number', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return Number(data?.[0]?.level_number) || 0;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('classic_category_levels')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async delete(levelId) {
    const id = String(levelId || '').trim();
    if (!id) return false;

    const { error, count } = await supabase
      .from('classic_category_levels')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}

