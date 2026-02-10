/**
 * Quiz repository (`quizzes` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Quiz already exists', 409, 'DUPLICATE');
  if (code === '23503') {
    return new AppError('Quiz cannot be deleted (has related records)', 409, 'CONFLICT');
  }
  if (code === '42703') {
    return new AppError(
      'Quizzes table schema mismatch (missing column). Apply `TriviaVerse/api/sql/003_quiz_keywords.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizRepository {
  constructor() {
    this._keywordsSupported = null;
  }

  baseSelectColumns() {
    return 'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at';
  }

  selectColumns() {
    if (this._keywordsSupported === false) return this.baseSelectColumns();
    return `${this.baseSelectColumns()}, keywords`;
  }

  isSchemaMissingColumn(error) {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  async countAll() {
    const { count, error } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(payload)
      .select(this.selectColumns())
      .limit(1);
    if (error) {
      if (this.isSchemaMissingColumn(error)) {
        this._keywordsSupported = false;
        if (payload?.keywords != null && String(payload.keywords).trim() !== '') {
          throw toAppError(error);
        }
        const { keywords, ...rest } = payload || {};
        const retry = await supabase
          .from('quizzes')
          .insert(rest)
          .select(this.selectColumns())
          .limit(1);
        if (retry.error) throw toAppError(retry.error);
        return retry.data?.[0] || null;
      }
      throw toAppError(error);
    }
    return data?.[0] || null;
  }

  async findById(id) {
    const res = await supabase
      .from('quizzes')
      .select(this.selectColumns())
      .eq('id', id)
      .limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase
        .from('quizzes')
        .select(this.selectColumns())
        .eq('id', id)
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] || null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async findByIds(ids = []) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await supabase
      .from('quizzes')
      .select(this.selectColumns())
      .in('id', unique);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase
        .from('quizzes')
        .select(this.selectColumns())
        .in('id', unique);
      if (retry.error) throw toAppError(retry.error);
      return retry.data || [];
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async update(id, patch) {
    const res = await supabase
      .from('quizzes')
      .update(patch)
      .eq('id', id)
      .select(this.selectColumns())
      .limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      if (patch?.keywords !== undefined) throw toAppError(res.error);

      const retry = await supabase
        .from('quizzes')
        .update(patch)
        .eq('id', id)
        .select(this.selectColumns())
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] || null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async listByOwnerUserId(owner_user_id) {
    const res = await supabase
      .from('quizzes')
      .select(this.selectColumns())
      .eq('owner_user_id', owner_user_id)
      .order('created_at', { ascending: false });
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase
        .from('quizzes')
        .select(this.selectColumns())
        .eq('owner_user_id', owner_user_id)
        .order('created_at', { ascending: false });
      if (retry.error) throw toAppError(retry.error);
      return retry.data || [];
    }
    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async searchPublishedByTitle({ q, visibilities = ['public'], limit = 30 }) {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 30));
    if (!query) return [];

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query);

    const keywordTokens = Array.from(
      new Set(
        query
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => t.replace(/[^a-z0-9_-]/gi, ''))
          .filter(Boolean)
          .slice(0, 5)
      )
    );
    const keywordOr = keywordTokens.map((t) => `keywords.ilike.%${t}%`).join(',');

    const runSearch = async ({ includeKeywords }) => {
      const cols = includeKeywords ? this.selectColumns() : this.baseSelectColumns();
      const kwOr = includeKeywords ? keywordOr : '';

      const [byTitle, byDesc, byKeywords, byId] = await Promise.all([
        supabase
          .from('quizzes')
          .select(cols)
          .eq('status', 'published')
          .in('visibility', visibilities)
          .ilike('title', `%${query}%`)
          .order('published_at', { ascending: false })
          .limit(lim),
        supabase
          .from('quizzes')
          .select(cols)
          .eq('status', 'published')
          .in('visibility', visibilities)
          .ilike('description', `%${query}%`)
          .order('published_at', { ascending: false })
          .limit(lim),
        kwOr
          ? supabase
              .from('quizzes')
              .select(cols)
              .eq('status', 'published')
              .in('visibility', visibilities)
              .or(kwOr)
              .order('published_at', { ascending: false })
              .limit(lim)
          : Promise.resolve({ data: [], error: null }),
        isUuid
          ? supabase
              .from('quizzes')
              .select(cols)
              .eq('status', 'published')
              .in('visibility', visibilities)
              .eq('id', query)
              .limit(1)
          : Promise.resolve({ data: [], error: null }),
      ]);

      return { byTitle, byDesc, byKeywords, byId };
    };

    let byTitle;
    let byDesc;
    let byKeywords;
    let byId;

    ({ byTitle, byDesc, byKeywords, byId } = await runSearch({
      includeKeywords: this._keywordsSupported !== false,
    }));

    const schemaError =
      (byTitle.error && this.isSchemaMissingColumn(byTitle.error)) ||
      (byDesc.error && this.isSchemaMissingColumn(byDesc.error)) ||
      (byKeywords.error && this.isSchemaMissingColumn(byKeywords.error)) ||
      (byId.error && this.isSchemaMissingColumn(byId.error));

    if (schemaError) {
      this._keywordsSupported = false;
      ({ byTitle, byDesc, byKeywords, byId } = await runSearch({ includeKeywords: false }));
    }

    if (byTitle.error) throw toAppError(byTitle.error);
    if (byDesc.error) throw toAppError(byDesc.error);
    if (byKeywords.error) throw toAppError(byKeywords.error);
    if (byId.error) throw toAppError(byId.error);

    const merged = [];
    const seen = new Set();
    for (const row of [
      ...(byId.data || []),
      ...(byTitle.data || []),
      ...(byDesc.data || []),
      ...(byKeywords.data || []),
    ]) {
      if (!row?.id) continue;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }

    merged.sort((a, b) => {
      const bt = new Date(b.published_at || b.created_at || 0).getTime();
      const at = new Date(a.published_at || a.created_at || 0).getTime();
      return bt - at;
    });

    return merged.slice(0, lim);
  }

  async listPublishedByVisibility({ visibilities = ['public'], limit = 50 }) {
    const lim = Math.min(200, Math.max(1, Number(limit) || 50));

    const res = await supabase
      .from('quizzes')
      .select(this.selectColumns())
      .eq('status', 'published')
      .in('visibility', visibilities)
      .order('published_at', { ascending: false })
      .limit(lim);

    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase
        .from('quizzes')
        .select(this.selectColumns())
        .eq('status', 'published')
        .in('visibility', visibilities)
        .order('published_at', { ascending: false })
        .limit(lim);
      if (retry.error) throw toAppError(retry.error);
      return retry.data || [];
    }

    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async delete(id) {
    const { error, count } = await supabase
      .from('quizzes')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}
