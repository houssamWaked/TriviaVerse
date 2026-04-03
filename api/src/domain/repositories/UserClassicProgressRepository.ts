/**
 * User classic progress repository (`user_classic_progress` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type UserClassicProgressRow = {
  id: string;
  user_id: string;
  level_id: string;
  best_score: number | null;
  stars_earned: number | null;
  attempts_count: number | null;
  is_unlocked: boolean | null;
  is_completed: boolean | null;
  last_played_at: string | null;
};

type ProgressPatch = Partial<Omit<UserClassicProgressRow, 'id' | 'user_id' | 'level_id'>>;
type UpsertResultInput = {
  score_total?: number;
  stars_earned?: number;
  is_completed?: boolean;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'User classic progress table is not configured. Apply `TriviaVerse/api/sql/009_classic_category_levels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapProgressRow = (row: unknown): UserClassicProgressRow => row as unknown as UserClassicProgressRow;

export class UserClassicProgressRepository {
  selectFields =
    'id, user_id, level_id, best_score, stars_earned, attempts_count, is_unlocked, is_completed, last_played_at';

  async listByUserId(userId: string): Promise<UserClassicProgressRow[]> {
    const { data, error } = await supabase.from('user_classic_progress').select(this.selectFields).eq('user_id', userId);
    if (error) throw toAppError(error);
    return (data || []).map(mapProgressRow);
  }

  async listByUserAndLevelIds(userId: string, levelIds: string[] = []): Promise<UserClassicProgressRow[]> {
    const uid = String(userId || '').trim();
    const ids = Array.from(new Set(levelIds.filter(Boolean)));
    if (!uid || ids.length === 0) return [];

    const { data, error } = await supabase
      .from('user_classic_progress')
      .select(this.selectFields)
      .eq('user_id', uid)
      .in('level_id', ids);
    if (error) throw toAppError(error);
    return (data || []).map(mapProgressRow);
  }

  async findByUserAndLevelId(userId: string, levelId: string): Promise<UserClassicProgressRow | null> {
    const { data, error } = await supabase
      .from('user_classic_progress')
      .select(this.selectFields)
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapProgressRow(data[0]) : null;
  }

  async upsertByUserAndLevelId(userId: string, levelId: string, patch: ProgressPatch = {}): Promise<UserClassicProgressRow | null> {
    const payload = { user_id: userId, level_id: levelId, ...patch };
    const { data, error } = await supabase
      .from('user_classic_progress')
      .upsert(payload, { onConflict: 'user_id,level_id' })
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapProgressRow(data[0]) : null;
  }

  async ensureUnlocked(userId: string, levelId: string): Promise<UserClassicProgressRow | null> {
    return this.upsertByUserAndLevelId(userId, levelId, { is_unlocked: true });
  }

  async upsertResult(
    userId: string,
    levelId: string,
    { score_total = 0, stars_earned = 0, is_completed }: UpsertResultInput
  ): Promise<UserClassicProgressRow | null> {
    const existing = await this.findByUserAndLevelId(userId, levelId);
    const best_score = Math.max(existing?.best_score ?? 0, Math.max(0, Number(score_total) || 0));
    const best_stars = Math.max(existing?.stars_earned ?? 0, Math.max(0, Number(stars_earned) || 0));
    const completed = Boolean(existing?.is_completed) || Boolean(is_completed);

    return this.upsertByUserAndLevelId(userId, levelId, {
      is_unlocked: true,
      is_completed: completed,
      best_score,
      stars_earned: best_stars,
      last_played_at: new Date().toISOString(),
    });
  }

  async bumpAttempts(progressId: string): Promise<UserClassicProgressRow | null> {
    const { data: current, error: readError } = await supabase
      .from('user_classic_progress')
      .select('id, attempts_count')
      .eq('id', progressId)
      .limit(1);
    if (readError) throw toAppError(readError);
    const attempts = ((current?.[0] as { attempts_count?: number } | undefined)?.attempts_count ?? 0) + 1;

    const { data, error } = await supabase
      .from('user_classic_progress')
      .update({ attempts_count: attempts, last_played_at: new Date().toISOString() })
      .eq('id', progressId)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapProgressRow(data[0]) : null;
  }

  async deleteByLevelId(levelId: string): Promise<true> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return true;

    const { error } = await supabase.from('user_classic_progress').delete().eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return true;
  }
}
