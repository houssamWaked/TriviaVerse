/**
 * Quiz repository (`quizzes` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Quiz already exists', 409, 'DUPLICATE');
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
}

