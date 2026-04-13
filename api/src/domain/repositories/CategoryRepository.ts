/**
 * Category repository (data access).
 */
import { supabase } from '../../config/supabase.js';
import { Category, type CategoryRecord } from '../entity/Category.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type CategoryPatch = {
  name?: string;
  icon?: string | null;
};

type CategoryInsert = {
  name: string;
  icon?: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') {
    return new AppError('Category already exists', 409, 'DUPLICATE');
  }
  if (code === '22P02') {
    return new AppError('Invalid id', 400, 'INVALID_ID');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapCategory = (row: CategoryRecord): Category => new Category(row);

export class CategoryRepository {
  /**
   * Create a new category.
   * @param name Category name.
   * @param icon Optional icon identifier.
   * @returns Created category entity.
   */
  async create({ name, icon = null }: CategoryInsert): Promise<Category> {
    const payload = { name: name.trim(), icon: icon ? icon.trim() : null };
    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select('id, name, icon, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    if (!data?.[0]) {
      throw new AppError('Failed to create category', 500, 'DB_ERROR');
    }
    return mapCategory(data[0] as CategoryRecord);
  }

  /**
   * Patch an existing category.
   * @param id Category id.
   * @param name Optional name patch.
   * @param icon Optional icon patch.
   * @returns Updated category entity or `null` if not found.
   */
  async update(id: string, { name, icon }: CategoryPatch): Promise<Category | null> {
    const patch: CategoryPatch = {};
    if (name !== undefined) patch.name = name.trim();
    if (icon !== undefined) patch.icon = icon === null ? null : icon.trim();

    const { data, error } = await supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select('id, name, icon, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? mapCategory(data[0] as CategoryRecord) : null;
  }

  /**
   * List all categories.
   * @returns Array of category entities.
   */
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toAppError(error);
    return (data || []).map((row) => mapCategory(row as CategoryRecord));
  }

  /**
   * Find a category by id.
   * @param id Category id.
   * @returns Category entity or `null`.
   */
  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .eq('id', id)
      .limit(1);

    if (error) throw toAppError(error);
    return data?.[0] ? mapCategory(data[0] as CategoryRecord) : null;
  }

  /**
   * Delete a category by id.
   * @param id Category id.
   * @returns `true` if a row was deleted.
   */
  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('categories').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * Search categories by a case-insensitive name match.
   * @param query Search text.
   * @returns Array of matching categories.
   */
  async search(query: string): Promise<Category[]> {
    const likeQuery = `%${String(query || '').trim()}%`;
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .ilike('name', likeQuery)
      .order('name', { ascending: true });

    if (error) throw toAppError(error);
    return (data || []).map((row) => mapCategory(row as CategoryRecord));
  }
}
