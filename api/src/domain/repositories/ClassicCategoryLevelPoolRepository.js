/**
 * Classic category level pool repository (`classic_category_level_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
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

export class ClassicCategoryLevelPoolRepository {
  async listAllQuestionIds() {
    const pageSize = 1000;
    const ids = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await supabase
        .from('classic_category_level_pool')
        .select('quiz_question_id')
        .order('created_at', { ascending: false })
        .order('quiz_question_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw toAppError(error);
      const page = (data || []).map((r) => r.quiz_question_id).filter(Boolean);
      ids.push(...page);
      if (page.length < pageSize) break;
    }

    return ids;
  }

  async countByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return 0;

    const { count, error } = await supabase
      .from('classic_category_level_pool')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', lid);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listAssignmentsByQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('level_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listQuestionIdsByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return [];

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('quiz_question_id')
      .eq('level_id', lid)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async listQuestionIdsByLevelIdPaged(levelId, { limit = 50, offset = 0 } = {}) {
    const lid = String(levelId || '').trim();
    if (!lid) return [];

    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('classic_category_level_pool')
      .select('quiz_question_id')
      .eq('level_id', lid)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(off, off + lim - 1);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async upsertMany(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return true;

    const now = new Date().toISOString();
    const rows = ids.map((id) => ({ level_id: lid, quiz_question_id: id, created_at: now }));

    const { error } = await supabase
      .from('classic_category_level_pool')
      .upsert(rows, { onConflict: 'level_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  async deleteMany(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_level_pool')
      .delete()
      .eq('level_id', lid)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteAllByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return true;

    const { error } = await supabase.from('classic_category_level_pool').delete().eq('level_id', lid);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuizQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase
      .from('classic_category_level_pool')
      .delete()
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}

