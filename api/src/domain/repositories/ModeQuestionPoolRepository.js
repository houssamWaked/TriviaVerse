/**
 * Mode question pool repository (`mode_question_pool` table).
 *
 * Allows separating global questions by mode (classic/blitz/millionaire).
 *
 * Expected schema:
 * - mode (text) -- e.g. 'classic' | 'blitz' | 'millionaire'
 * - quiz_question_id (uuid)
 * - created_at (timestamptz, default now())
 *
 * Expected unique constraint:
 * - (mode, quiz_question_id)
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
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

export class ModeQuestionPoolRepository {
  async listAllQuestionIds() {
    const pageSize = 1000;
    const ids = [];

    for (let offset = 0; offset < 100_000; offset += pageSize) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await supabase
        .from('mode_question_pool')
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

  async listAssignmentsByQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('mode, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listQuestionIdsByMode(mode) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) return [];

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('quiz_question_id')
      .eq('mode', m)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async listQuestionIdsByModePaged(mode, { limit = 50, offset = 0 } = {}) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) return [];

    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('mode_question_pool')
      .select('quiz_question_id')
      .eq('mode', m)
      .order('created_at', { ascending: false })
      .order('quiz_question_id', { ascending: true })
      .range(off, off + lim - 1);

    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async upsertMany(mode, questionIds = []) {
    const m = String(mode || '').trim().toLowerCase();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!m || ids.length === 0) return true;

    const now = new Date().toISOString();
    const rows = ids.map((id) => ({ mode: m, quiz_question_id: id, created_at: now }));

    const { error } = await supabase
      .from('mode_question_pool')
      .upsert(rows, { onConflict: 'mode,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  async deleteMany(mode, questionIds = []) {
    const m = String(mode || '').trim().toLowerCase();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!m || ids.length === 0) return true;

    const { error } = await supabase
      .from('mode_question_pool')
      .delete()
      .eq('mode', m)
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteAllByMode(mode) {
    const m = String(mode || '').trim().toLowerCase();
    if (!m) return true;

    const { error } = await supabase.from('mode_question_pool').delete().eq('mode', m);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuizQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase.from('mode_question_pool').delete().in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
