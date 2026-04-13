/**
 * Game session repository (`game_sessions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type GameSessionStatus = 'in_progress' | 'completed' | 'abandoned' | string;

type GameSessionRow = {
  id: string;
  user_id: string | null;
  mode: string;
  quiz_id: string | null;
  category_id: string | null;
  difficulty: string | null;
  total_questions: number | null;
  started_at: string | null;
  ended_at: string | null;
  score_total: number | null;
  status: GameSessionStatus;
};

type CreateGameSessionInput = Omit<GameSessionRow, 'id'> & {
  id?: string;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, user_id, mode, quiz_id, category_id, difficulty, total_questions, started_at, ended_at, score_total, status';
const mapSessionRow = (row: unknown): GameSessionRow => row as unknown as GameSessionRow;

/**
 * Repository for reading/writing `game_sessions` rows.
 */
export class GameSessionRepository {
  /**
   * Count distinct users who have any session rows.
   * @returns Number of distinct non-null `user_id`s.
   */
  async countDistinctActivePlayers(): Promise<number> {
    const { data, error } = await supabase.from('game_sessions').select('user_id');
    if (error) throw toAppError(error);

    const ids = new Set(
      (data || [])
        .map((row) => (row as { user_id?: string | null }).user_id)
        .filter((value): value is string => Boolean(value))
    );
    return ids.size;
  }

  /**
   * Create a new game session row.
   * @param payload Insert payload.
   * @returns Created session row or `null`.
   */
  async create(payload: CreateGameSessionInput): Promise<GameSessionRow | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(payload)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Find a session by id.
   * @param id Session id.
   * @returns Session row or `null`.
   */
  async findById(id: string): Promise<GameSessionRow | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(selectFields)
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Update a session status and set `ended_at` to now.
   * @param id Session id.
   * @param status New status.
   * @returns Updated session row or `null`.
   */
  async updateStatus(id: string, status: GameSessionStatus): Promise<GameSessionRow | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ status, ended_at: new Date().toISOString() })
      .eq('id', id)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Increment the session score total.
   * @param id Session id.
   * @param scoreDelta Non-negative score delta.
   * @returns Updated session row or `null`.
   */
  async addScore(id: string, scoreDelta: number): Promise<GameSessionRow | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const nextScore = (current.score_total ?? 0) + Math.max(0, Number(scoreDelta) || 0);
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ score_total: nextScore })
      .eq('id', id)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Set the session `total_questions` field.
   * @param id Session id.
   * @param totalQuestions Total questions value.
   * @returns Updated session row or `null`.
   */
  async setTotalQuestions(id: string, totalQuestions: number): Promise<GameSessionRow | null> {
    const nextTotal = Math.max(0, Number(totalQuestions) || 0);
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ total_questions: nextTotal })
      .eq('id', id)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Set the session score total.
   * @param id Session id.
   * @param scoreTotal Non-negative score total.
   * @returns Updated session row or `null`.
   */
  async setScore(id: string, scoreTotal: number): Promise<GameSessionRow | null> {
    const nextScore = Math.max(0, Number(scoreTotal) || 0);
    const { data, error } = await supabase
      .from('game_sessions')
      .update({ score_total: nextScore })
      .eq('id', id)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionRow(data[0]) : null;
  }

  /**
   * Clear `quiz_id` on sessions referencing a quiz (helps avoid FK issues on quiz delete).
   * @param quizId Quiz id.
   * @returns `true` on success.
   */
  async clearQuizIdForQuiz(quizId: string): Promise<true> {
    const { error } = await supabase.from('game_sessions').update({ quiz_id: null }).eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * List sessions for a user ordered by `ended_at` desc.
   * @param userId User id.
   * @param limit Max rows to return.
   * @returns Array of session rows.
   */
  async listByUserId(userId: string, limit = 200): Promise<GameSessionRow[]> {
    const normalizedLimit = Math.min(1000, Math.max(1, Number(limit) || 200));
    const { data, error } = await supabase
      .from('game_sessions')
      .select(selectFields)
      .eq('user_id', userId)
      .order('ended_at', { ascending: false, nullsFirst: false })
      .limit(normalizedLimit);
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionRow);
  }

  /**
   * List sessions by ids.
   * @param ids Session ids.
   * @returns Array of session rows.
   */
  async listByIds(ids: string[] = []): Promise<GameSessionRow[]> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return [];

    const { data, error } = await supabase.from('game_sessions').select(selectFields).in('id', uniqueIds);
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionRow);
  }
}
