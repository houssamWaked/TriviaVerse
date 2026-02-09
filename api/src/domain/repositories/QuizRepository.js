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
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuizRepository {
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
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findByIds(ids = []) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (unique.length === 0) return [];

    const { data, error } = await supabase
      .from('quizzes')
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .in('id', unique);
    if (error) throw toAppError(error);
    return data || [];
  }

  async update(id, patch) {
    const { data, error } = await supabase
      .from('quizzes')
      .update(patch)
      .eq('id', id)
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listByOwnerUserId(owner_user_id) {
    const { data, error } = await supabase
      .from('quizzes')
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .eq('owner_user_id', owner_user_id)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return data || [];
  }

  async searchPublishedByTitle({ q, visibilities = ['public'], limit = 30 }) {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 30));
    if (!query) return [];

    const select =
      'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at';

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query);

    const [byTitle, byDesc, byId] = await Promise.all([
      supabase
        .from('quizzes')
        .select(select)
        .eq('status', 'published')
        .in('visibility', visibilities)
        .ilike('title', `%${query}%`)
        .order('published_at', { ascending: false })
        .limit(lim),
      supabase
        .from('quizzes')
        .select(select)
        .eq('status', 'published')
        .in('visibility', visibilities)
        .ilike('description', `%${query}%`)
        .order('published_at', { ascending: false })
        .limit(lim),
      isUuid
        ? supabase
            .from('quizzes')
            .select(select)
            .eq('status', 'published')
            .in('visibility', visibilities)
            .eq('id', query)
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (byTitle.error) throw toAppError(byTitle.error);
    if (byDesc.error) throw toAppError(byDesc.error);
    if (byId.error) throw toAppError(byId.error);

    const merged = [];
    const seen = new Set();
    for (const row of [...(byId.data || []), ...(byTitle.data || []), ...(byDesc.data || [])]) {
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

    const { data, error } = await supabase
      .from('quizzes')
      .select(
        'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at'
      )
      .eq('status', 'published')
      .in('visibility', visibilities)
      .order('published_at', { ascending: false })
      .limit(lim);

    if (error) throw toAppError(error);
    return data || [];
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
