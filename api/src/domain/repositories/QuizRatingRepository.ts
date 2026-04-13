/**
 * Quiz ratings repository (`quiz_ratings` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizRatingRow = {
  quiz_id: string;
  user_id?: string;
  rating: number;
};

type UpsertQuizRatingInput = {
  quiz_id: string;
  user_id: string;
  rating: number;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Ratings table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapRatingRow = (row: unknown): QuizRatingRow => row as unknown as QuizRatingRow;

/**
 * Repository for reading/writing `quiz_ratings` rows.
 */
export class QuizRatingRepository {
  /**
   * Upsert a user's rating for a quiz.
   * @param quiz_id Quiz id.
   * @param user_id User id.
   * @param rating Rating value.
   * @returns Upserted rating row or `null`.
   */
  async upsert({ quiz_id, user_id, rating }: UpsertQuizRatingInput): Promise<QuizRatingRow | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('quiz_ratings')
      .upsert({ quiz_id, user_id, rating, updated_at: now }, { onConflict: 'quiz_id,user_id' })
      .select('quiz_id, user_id, rating')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapRatingRow(data[0]) : null;
  }

  /**
   * Fetch a user's rating for a quiz.
   * @param quizId Quiz id.
   * @param userId User id.
   * @returns Rating row or `null`.
   */
  async getUserRating(quizId: string, userId: string): Promise<QuizRatingRow | null> {
    const { data, error } = await supabase
      .from('quiz_ratings')
      .select('quiz_id, user_id, rating')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapRatingRow(data[0]) : null;
  }

  /**
   * List ratings for a set of quizzes.
   * @param quizIds Quiz ids.
   * @returns Array of rating rows (quiz id + rating).
   */
  async listByQuizIds(quizIds: string[] = []): Promise<QuizRatingRow[]> {
    const unique = Array.from(new Set(quizIds.filter(Boolean)));
    if (unique.length === 0) return [];

    const { data, error } = await supabase.from('quiz_ratings').select('quiz_id, rating').in('quiz_id', unique);
    if (error) throw toAppError(error);
    return (data || []).map(mapRatingRow);
  }

  /**
   * List ratings for a single quiz.
   * @param quizId Quiz id.
   * @returns Array of rating rows (quiz id + rating).
   */
  async listByQuizId(quizId: string): Promise<QuizRatingRow[]> {
    const { data, error } = await supabase.from('quiz_ratings').select('quiz_id, rating').eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return (data || []).map(mapRatingRow);
  }

  /**
   * Delete all ratings for a quiz.
   * @param quizId Quiz id.
   * @returns `true` on success.
   */
  async deleteByQuizId(quizId: string): Promise<true> {
    const { error } = await supabase.from('quiz_ratings').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
