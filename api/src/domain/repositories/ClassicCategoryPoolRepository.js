/**
 * Classic category pool repository (`classic_category_pool` table).
 *
 * Expected schema:
 * - category_id (uuid)
 * - quiz_question_id (uuid)
 * - created_at (timestamptz, default now())
 *
 * Expected unique constraint:
 * - (category_id, quiz_question_id)
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Classic category pool table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class ClassicCategoryPoolRepository {
  async listAssignmentsByQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('category_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async countByCategoryId(categoryId) {
    const cid = String(categoryId || '').trim();
    if (!cid) return 0;

    const { count, error } = await supabase
      .from('classic_category_pool')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cid);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listQuestionIdsByCategoryId(categoryId) {
    const cid = String(categoryId || '').trim();
    if (!cid) return [];

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('quiz_question_id')
      .eq('category_id', cid);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async listQuestionIdsByCategoryIdPaged(categoryId, { limit = 50, offset = 0 } = {}) {
    const cid = String(categoryId || '').trim();
    if (!cid) return [];

    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('classic_category_pool')
      .select('quiz_question_id')
      .eq('category_id', cid)
      .range(off, off + lim - 1);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async upsertMany(categoryId, questionIds = []) {
    const cid = String(categoryId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!cid || ids.length === 0) return true;

    const now = new Date().toISOString();
    const rows = ids.map((id) => ({ category_id: cid, quiz_question_id: id, created_at: now }));

    const { error } = await supabase
      .from('classic_category_pool')
      .upsert(rows, { onConflict: 'category_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  async deleteMany(categoryId, questionIds = []) {
    const cid = String(categoryId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!cid || ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_pool')
      .delete()
      .eq('category_id', cid)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteAllByCategoryId(categoryId) {
    const cid = String(categoryId || '').trim();
    if (!cid) return true;

    const { error } = await supabase
      .from('classic_category_pool')
      .delete()
      .eq('category_id', cid);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuizQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_pool')
      .delete()
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
