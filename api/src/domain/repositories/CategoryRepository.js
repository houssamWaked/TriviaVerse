/**
 * Category repository (data access).
 *
 * Responsibilities:
 * - Encapsulate Supabase queries for the `categories` table
 * - Translate raw rows into domain entities (`domain/entity/Category.js`)
 * - Throw `AppError` for known/expected database errors
 *
 * Not-found behavior:
 * - `findById` returns `null` if there is no matching row
 * - `update` returns `null` if there is no matching row
 * - `delete` returns `false` if there is no matching row
 */
import { supabase } from '../../config/supabase.js';
import { Category } from '../entity/Category.js';
import AppError from '../../utils/AppError.js';

/**
 * Convert Supabase/Postgres errors to stable API errors.
 *
 * Supabase usually surfaces `error.code` with underlying Postgres SQLSTATE codes.
 * We map a small set we care about now; everything else becomes a 500.
 *
 * @param {{message?: string, code?: string}|null} error
 * @returns {AppError|null}
 */
function toAppError(error) {
  if (!error) return null;

  const code = String(error.code || '').trim();

  // Postgres: unique_violation
  if (code === '23505') {
    return new AppError('Category already exists', 409, 'DUPLICATE');
  }

  // Postgres: invalid_text_representation (e.g. invalid uuid)
  if (code === '22P02') {
    return new AppError('Invalid id', 400, 'INVALID_ID');
  }

  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class CategoryRepository {
  /**
   * Insert a new category row.
   *
   * @param {{name: string, icon?: (string|null)}} params
   * @returns {Promise<Category>}
   * @throws {AppError} 409 on duplicates, 500 on DB errors
   */
  async create({ name, icon = null }) {
    const payload = { name: name?.trim(), icon: icon ? icon.trim() : null };

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select('id, name, icon, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    if (!data?.[0]) {
      throw new AppError('Failed to create category', 500, 'DB_ERROR');
    }
    return new Category(data[0]);
  }

  /**
   * Update an existing category by id.
   *
   * Only provided fields are patched.
   *
   * @param {string} id UUID
   * @param {{name?: string, icon?: (string|null)}} patch
   * @returns {Promise<Category|null>} entity if updated, otherwise null if not found
   */
  async update(id, { name, icon }) {
    const patch = {};

    if (name !== undefined) patch.name = name?.trim();
    if (icon !== undefined) patch.icon = icon === null ? null : icon?.trim();

    const { data, error } = await supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select('id, name, icon, created_at')
      .limit(1);

    if (error) throw toAppError(error);
    return data && data[0] ? new Category(data[0]) : null;
  }

  /**
   * List all categories, newest first.
   * @returns {Promise<Category[]>}
   */
  async findAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toAppError(error);
    return (data || []).map((r) => new Category(r));
  }

  /**
   * Find a category by id.
   * @param {string} id UUID
   * @returns {Promise<Category|null>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .eq('id', id)
      .limit(1);

    if (error) throw toAppError(error);
    return data && data[0] ? new Category(data[0]) : null;
  }

  /**
   * Delete a category by id.
   * @param {string} id UUID
   * @returns {Promise<boolean>} true if deleted
   */
  async delete(id) {
    const { error, count } = await supabase
      .from('categories')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * Search categories by name (case-insensitive).
   * @param {string} query
   * @returns {Promise<Category[]>}
   */
  async search(query) {
    // Supabase doesn't support ILIKE everywhere the same way;
    // safest: lower() + like via textSearch isn't ideal, so use ilike if available.
    const q = `%${String(query || '').trim()}%`;

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, created_at')
      .ilike('name', q)
      .order('name', { ascending: true });

    if (error) throw toAppError(error);
    return (data || []).map((r) => new Category(r));
  }
}
