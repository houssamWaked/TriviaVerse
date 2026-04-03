/**
 * Custom quiz scores repository (`quiz_scores` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizScoreRow = {
  quiz_id: string;
  user_id: string;
  best_score: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type UpsertBestInput = {
  quiz_id: string;
  user_id: string;
  score_value: number;
};

type RpcPlayCountRow = {
  quiz_id?: string;
  played_count?: number;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Quiz scores table is not configured. Apply `TriviaVerse/api/sql/002_quiz_scores.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '42P10') {
    return new AppError(
      'Quiz scores table schema mismatch: missing unique constraint on (quiz_id, user_id). Apply `TriviaVerse/api/sql/002_quiz_scores.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapScoreRow = (row: unknown): QuizScoreRow => row as unknown as QuizScoreRow;

export class QuizScoreRepository {
  async countPlayersByQuizIds(quizIds: string[] = []): Promise<Map<string, number>> {
    const ids = Array.from(new Set(quizIds.filter(Boolean))).slice(0, 200);
    const counts = new Map<string, number>();
    if (ids.length === 0) return counts;

    const { data: rpcData, error: rpcError } = await supabase.rpc('custom_quiz_play_counts', { quiz_ids: ids });
    if (!rpcError && Array.isArray(rpcData)) {
      for (const row of rpcData as RpcPlayCountRow[]) {
        if (!row?.quiz_id) continue;
        counts.set(String(row.quiz_id), Number(row.played_count) || 0);
      }
      return counts;
    }

    const rpcCode = String(rpcError?.code || '').trim();
    if (rpcCode && rpcCode !== '42883') {
      throw toAppError(rpcError);
    }

    const { data, error } = await supabase.from('quiz_scores').select('quiz_id').in('quiz_id', ids);
    if (error) throw toAppError(error);
    for (const row of data || []) {
      const id = (row as { quiz_id?: string }).quiz_id;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }

  async findByQuizAndUser(quizId: string, userId: string): Promise<QuizScoreRow | null> {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, created_at, updated_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapScoreRow(data[0]) : null;
  }

  async upsertBest({ quiz_id, user_id, score_value }: UpsertBestInput): Promise<QuizScoreRow | null> {
    const score = Math.max(0, Number(score_value) || 0);
    const existing = await this.findByQuizAndUser(quiz_id, user_id);
    if (existing && (Number(existing.best_score) || 0) >= score) return existing;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('quiz_scores')
      .upsert({ quiz_id, user_id, best_score: score, updated_at: now }, { onConflict: 'quiz_id,user_id' })
      .select('quiz_id, user_id, best_score, created_at, updated_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapScoreRow(data[0]) : null;
  }

  async listTopByQuizId(quizId: string, limit = 20): Promise<QuizScoreRow[]> {
    const lim = Math.min(100, Math.max(1, Number(limit) || 20));
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, updated_at')
      .eq('quiz_id', quizId)
      .order('best_score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return (data || []).map(mapScoreRow);
  }

  async listByUserId(userId: string, limit = 100): Promise<QuizScoreRow[]> {
    const lim = Math.min(200, Math.max(1, Number(limit) || 100));
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return (data || []).map(mapScoreRow);
  }

  async deleteByQuizId(quizId: string): Promise<true> {
    const { error } = await supabase.from('quiz_scores').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
