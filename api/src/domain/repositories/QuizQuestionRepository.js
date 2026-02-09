/**
 * Quiz question repository (`quiz_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

const SELECT_FIELDS =
  'id, quiz_id, question_text, explanation, time_limit_sec, points, order_index, difficulty_rating';
const SELECT_FIELDS_FALLBACK =
  'id, quiz_id, question_text, explanation, time_limit_sec, points, order_index';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42703') {
    return new AppError(
      'Quiz question difficulty rating column is not configured',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizQuestionRepository {
  async countAll() {
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async listByQuizId(quizId) {
    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async findById(id) {
    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .limit(1);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .eq('id', id)
        .limit(1);
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async create(payload) {
    let res = await supabase
      .from('quiz_questions')
      .insert(payload)
      .select(SELECT_FIELDS)
      .limit(1);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .insert(payload)
        .select(SELECT_FIELDS_FALLBACK)
        .limit(1);
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async update(id, patch) {
    let res = await supabase
      .from('quiz_questions')
      .update(patch)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .limit(1);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .update(patch)
        .eq('id', id)
        .select(SELECT_FIELDS_FALLBACK)
        .limit(1);
    }
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
    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .limit(cap);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase.from('quiz_questions').select(SELECT_FIELDS_FALLBACK).limit(cap);
    }
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
    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .is('quiz_id', null)
      .limit(cap);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .is('quiz_id', null)
        .limit(cap);
    }
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

    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .in('id', unique);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .in('id', unique);
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async searchGlobalByText({ q, limit = 20 } = {}) {
    const query = String(q || '').trim();
    if (!query) return [];
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));

    let res = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .is('quiz_id', null)
      .ilike('question_text', `%${query}%`)
      .order('question_text', { ascending: true })
      .limit(lim);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      res = await supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .is('quiz_id', null)
        .ilike('question_text', `%${query}%`)
        .order('question_text', { ascending: true })
        .limit(lim);
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async listGlobal({ q = '', limit = 20, offset = 0 } = {}) {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    const off = Math.max(0, Number(offset) || 0);

    let req = supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS)
      .is('quiz_id', null);

    if (query) req = req.ilike('question_text', `%${query}%`);

    let res = await req.order('question_text', { ascending: true }).range(off, off + lim - 1);
    if (res.error && String(res.error.code || '').trim() === '42703') {
      let req2 = supabase
        .from('quiz_questions')
        .select(SELECT_FIELDS_FALLBACK)
        .is('quiz_id', null);
      if (query) req2 = req2.ilike('question_text', `%${query}%`);
      res = await req2.order('question_text', { ascending: true }).range(off, off + lim - 1);
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
