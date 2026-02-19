/**
 * Quiz question repository (`quiz_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

const SELECT_FIELDS_BASE =
  'id, quiz_id, question_text, explanation, time_limit_sec, points, order_index';
const SELECT_FIELDS_DIFFICULTY = `${SELECT_FIELDS_BASE}, difficulty_rating`;
const SELECT_FIELDS_ASSIGNED = `${SELECT_FIELDS_BASE}, is_assigned`;
const SELECT_FIELDS_FULL = `${SELECT_FIELDS_BASE}, difficulty_rating, is_assigned`;

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42703') {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('difficulty_rating')) {
      return new AppError(
        'Quiz question difficulty rating column is not configured',
        501,
        'NOT_CONFIGURED'
      );
    }
    if (msg.includes('is_assigned')) {
      return new AppError(
        'Quiz question assignment flag is not configured. Apply `TriviaVerse/api/sql/008_quiz_questions_is_assigned.sql`.',
        501,
        'NOT_CONFIGURED'
      );
    }
    return new AppError('Quiz questions schema is missing expected columns', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

async function selectWithFallback(run) {
  let res = await run(SELECT_FIELDS_FULL);
  if (res?.error && String(res.error.code || '').trim() === '42703') {
    const msg = String(res.error.message || '').toLowerCase();
    if (msg.includes('is_assigned')) {
      res = await run(SELECT_FIELDS_DIFFICULTY);
    } else if (msg.includes('difficulty_rating')) {
      res = await run(SELECT_FIELDS_ASSIGNED);
    } else {
      res = await run(SELECT_FIELDS_BASE);
    }
  }

  if (res?.error && String(res.error.code || '').trim() === '42703') {
    // Last resort: base fields only.
    res = await run(SELECT_FIELDS_BASE);
  }

  return res;
}

export class QuizQuestionRepository {
  async countAll() {
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async countByQuizId(quizId) {
    const id = String(quizId || '').trim();
    if (!id) return 0;
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', id);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listByQuizId(quizId) {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).eq('quiz_id', quizId).order('order_index', {
        ascending: true,
      })
    );
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async findById(id) {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).eq('id', id).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async create(payload) {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').insert(payload).select(fields).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async update(id, patch) {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').update(patch).eq('id', id).select(fields).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async delete(id) {
    const { error, count } = await supabase
      .from('quiz_questions')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async listRandom(limit) {
    const cap = Math.min(200, Math.max(1, limit * 5));
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).limit(cap)
    );
    if (res.error) throw toAppError(res.error);

    const rows = res.data || [];
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(limit, rows.length));
  }

  async listRandomGlobal(limit) {
    const cap = Math.min(200, Math.max(1, limit * 5));
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).is('quiz_id', null).limit(cap)
    );
    if (res.error) throw toAppError(res.error);

    const rows = res.data || [];
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(limit, rows.length));
  }

  async listRandomGlobalByDifficultyRange(limit, { min = 1, max = 10 } = {}) {
    const lim = Math.max(1, Number(limit) || 1);
    const dmin = Math.min(10, Math.max(1, Number(min) || 1));
    const dmax = Math.min(10, Math.max(dmin, Number(max) || dmin));

    const cap = Math.min(500, Math.max(10, lim * 20));
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, explanation, time_limit_sec, points, order_index')
      .is('quiz_id', null)
      .gte('difficulty_rating', dmin)
      .lte('difficulty_rating', dmax)
      .limit(cap);
    if (error) throw toAppError(error);

    const rows = data || [];
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(lim, rows.length));
  }

  async listByIds(ids = []) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).in('id', unique)
    );
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async listGlobal({ q = '', limit = 20, offset = 0, assigned = 'all' } = {}) {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    const off = Math.max(0, Number(offset) || 0);
    const a = String(assigned || 'all')
      .trim()
      .toLowerCase();

    let res = await selectWithFallback((fields) => {
      let req = supabase.from('quiz_questions').select(fields).is('quiz_id', null);
      if (query) req = req.ilike('question_text', `%${query}%`);
      if (a === 'assigned') req = req.eq('is_assigned', true);
      if (a === 'unassigned') req = req.eq('is_assigned', false);
      return req
        .order('question_text', { ascending: true })
        .order('id', { ascending: true })
        .range(off, off + lim - 1);
    });

    // Back-compat: if is_assigned column isn't deployed, re-run without the filter.
    if (res?.error && String(res.error.code || '').trim() === '42703') {
      const msg = String(res.error.message || '').toLowerCase();
      if (msg.includes('is_assigned')) {
        res = await selectWithFallback((fields) => {
          let req = supabase.from('quiz_questions').select(fields).is('quiz_id', null);
          if (query) req = req.ilike('question_text', `%${query}%`);
          return req
            .order('question_text', { ascending: true })
            .order('id', { ascending: true })
            .range(off, off + lim - 1);
        });
      }
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async deleteByQuizId(quizId) {
    const { error } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
