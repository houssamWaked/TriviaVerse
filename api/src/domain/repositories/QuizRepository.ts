/**
 * Quiz repository (`quizzes` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizVisibility = 'private' | 'public' | 'unlisted' | string;
type QuizStatus = 'draft' | 'published' | string;

type QuizRow = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: QuizVisibility;
  status: QuizStatus;
  keywords?: string | null;
  created_at: string | null;
  published_at: string | null;
};

type CreateQuizInput = Omit<QuizRow, 'id' | 'created_at' | 'published_at'> & {
  id?: string;
  created_at?: string | null;
  published_at?: string | null;
};

type UpdateQuizInput = Partial<Omit<QuizRow, 'id' | 'owner_user_id' | 'created_at'>>;
type SearchPublishedInput = { q: string; visibilities?: string[]; limit?: number };
type ListPublishedInput = { visibilities?: string[]; limit?: number };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Quiz already exists', 409, 'DUPLICATE');
  if (code === '23503') return new AppError('Quiz cannot be deleted (has related records)', 409, 'CONFLICT');
  if (code === '42703') {
    return new AppError(
      'Quizzes table schema mismatch (missing column). Apply `TriviaVerse/api/sql/003_quiz_keywords.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapQuizRow = (row: unknown): QuizRow => row as unknown as QuizRow;

export class QuizRepository {
  _keywordsSupported: boolean | null;

  constructor() {
    this._keywordsSupported = null;
  }

  baseSelectColumns(): string {
    return 'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at';
  }

  selectColumns(): string {
    if (this._keywordsSupported === false) return this.baseSelectColumns();
    return `${this.baseSelectColumns()}, keywords`;
  }

  isSchemaMissingColumn(error: DatabaseErrorLike): boolean {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  async countAll(): Promise<number> {
    const { count, error } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  async create(payload: CreateQuizInput): Promise<QuizRow | null> {
    const { data, error } = await supabase.from('quizzes').insert(payload).select(this.selectColumns()).limit(1);
    if (error) {
      if (this.isSchemaMissingColumn(error)) {
        this._keywordsSupported = false;
        if (payload?.keywords != null && String(payload.keywords).trim() !== '') {
          throw toAppError(error);
        }
        const { keywords, ...rest } = payload;
        const retry = await supabase.from('quizzes').insert(rest).select(this.selectColumns()).limit(1);
        if (retry.error) throw toAppError(retry.error);
        return retry.data?.[0] ? mapQuizRow(retry.data[0]) : null;
      }
      throw toAppError(error);
    }
    return data?.[0] ? mapQuizRow(data[0]) : null;
  }

  async findById(id: string): Promise<QuizRow | null> {
    const res = await supabase.from('quizzes').select(this.selectColumns()).eq('id', id).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase.from('quizzes').select(this.selectColumns()).eq('id', id).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapQuizRow(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapQuizRow(res.data[0]) : null;
  }

  async findByIds(ids: string[] = []): Promise<QuizRow[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];

    const res = await supabase.from('quizzes').select(this.selectColumns()).in('id', unique);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      const retry = await supabase.from('quizzes').select(this.selectColumns()).in('id', unique);
      if (retry.error) throw toAppError(retry.error);
      return (retry.data || []).map(mapQuizRow);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuizRow);
  }

  async update(id: string, patch: UpdateQuizInput): Promise<QuizRow | null> {
    const res = await supabase.from('quizzes').update(patch).eq('id', id).select(this.selectColumns()).limit(1);
    if (res.error && this.isSchemaMissingColumn(res.error)) {
      this._keywordsSupported = false;
      if (patch?.keywords !== undefined) throw toAppError(res.error);
      const retry = await supabase.from('quizzes').update(patch).eq('id', id).select(this.selectColumns()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapQuizRow(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapQuizRow(res.data[0]) : null;
  }

  async listByOwnerUserId(owner_user_id: string): Promise<QuizRow[]> {
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
      return (retry.data || []).map(mapQuizRow);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuizRow);
  }

  async searchPublishedByTitle({
    q,
    visibilities = ['public'],
    limit = 30,
  }: SearchPublishedInput): Promise<QuizRow[]> {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 30));
    if (!query) return [];

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query);
    const keywordTokens = Array.from(
      new Set(
        query
          .split(/[\s,]+/)
          .map((token) => token.trim())
          .filter(Boolean)
          .map((token) => token.replace(/[^a-z0-9_-]/gi, ''))
          .filter(Boolean)
          .slice(0, 5)
      )
    );
    const keywordOr = keywordTokens.map((token) => `keywords.ilike.%${token}%`).join(',');

    const runSearch = async ({ includeKeywords }: { includeKeywords: boolean }) => {
      const cols = includeKeywords ? this.selectColumns() : this.baseSelectColumns();
      const kwOr = includeKeywords ? keywordOr : '';
      const [byTitle, byDesc, byKeywords, byId] = await Promise.all([
        supabase.from('quizzes').select(cols).eq('status', 'published').in('visibility', visibilities).ilike('title', `%${query}%`).order('published_at', { ascending: false }).limit(lim),
        supabase.from('quizzes').select(cols).eq('status', 'published').in('visibility', visibilities).ilike('description', `%${query}%`).order('published_at', { ascending: false }).limit(lim),
        kwOr
          ? supabase.from('quizzes').select(cols).eq('status', 'published').in('visibility', visibilities).or(kwOr).order('published_at', { ascending: false }).limit(lim)
          : Promise.resolve({ data: [], error: null }),
        isUuid
          ? supabase.from('quizzes').select(cols).eq('status', 'published').in('visibility', visibilities).eq('id', query).limit(1)
          : Promise.resolve({ data: [], error: null }),
      ]);
      return { byTitle, byDesc, byKeywords, byId };
    };

    let { byTitle, byDesc, byKeywords, byId } = await runSearch({
      includeKeywords: this._keywordsSupported !== false,
    });

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

    const merged: QuizRow[] = [];
    const seen = new Set<string>();
    for (const row of [...(byId.data || []), ...(byTitle.data || []), ...(byDesc.data || []), ...(byKeywords.data || [])]) {
      const mapped = mapQuizRow(row);
      if (!mapped.id || seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      merged.push(mapped);
    }

    merged.sort((a, b) => {
      const bt = new Date(b.published_at || b.created_at || 0).getTime();
      const at = new Date(a.published_at || a.created_at || 0).getTime();
      return bt - at;
    });
    return merged.slice(0, lim);
  }

  async listPublishedByVisibility({ visibilities = ['public'], limit = 50 }: ListPublishedInput = {}): Promise<QuizRow[]> {
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
      return (retry.data || []).map(mapQuizRow);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuizRow);
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('quizzes').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}
