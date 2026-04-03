/**
 * Leaderboard repository (`leaderboard_entries` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type LeaderboardPeriod = 'all_time' | 'weekly';

type LeaderboardRow = {
  rank_position?: number | null;
  user_id: string;
  score_value: number;
  period: string;
  mode: string;
};

type ListLeaderboardInput = {
  period: string;
  mode: string;
  limit?: number;
};

type FindLeaderboardRowInput = {
  user_id: string;
  period: string;
  mode: string;
};

type InsertFromSessionInput = {
  user_id: string;
  mode: string;
  score_value: number;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Leaderboard entries table is not configured', 501, 'NOT_CONFIGURED');
  }
  if (code === '23514') {
    return new AppError(
      'Leaderboard entries table schema mismatch: `leaderboard_entries_mode_check` rejected this mode value. Apply `TriviaVerse/api/sql/leaderboard_entries_mode_fix.sql` (or update the check constraint to include the new modes).',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  if (code === '42P10') {
    return new AppError(
      'Leaderboard entries table schema mismatch: missing unique constraint on (user_id, period, mode). Apply `TriviaVerse/api/sql/leaderboard_entries_fix.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapLeaderboardRow = (row: unknown): LeaderboardRow => row as unknown as LeaderboardRow;

export class LeaderboardRepository {
  async list({ period, mode, limit = 50 }: ListLeaderboardInput): Promise<LeaderboardRow[]> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('rank_position, user_id, score_value, period, mode')
      .eq('period', period)
      .eq('mode', mode)
      .order('rank_position', { ascending: true, nullsFirst: false })
      .order('score_value', { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return (data || []).map(mapLeaderboardRow);
  }

  async findByUserPeriodMode({
    user_id,
    period,
    mode,
  }: FindLeaderboardRowInput): Promise<LeaderboardRow | null> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('user_id, period, mode, score_value')
      .eq('user_id', user_id)
      .eq('period', period)
      .eq('mode', mode)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapLeaderboardRow(data[0]) : null;
  }

  async insertFromSession({
    user_id,
    mode,
    score_value,
  }: InsertFromSessionInput): Promise<LeaderboardRow | null> {
    const score = Math.max(0, Number(score_value) || 0);

    const upsertBestForPeriod = async (
      period: LeaderboardPeriod,
      modeOverride: string | null = null
    ): Promise<LeaderboardRow | null> => {
      const effectiveMode = modeOverride || mode;

      const { error } = await supabase
        .from('leaderboard_entries')
        .upsert(
          { user_id, period, mode: effectiveMode, score_value: score },
          { onConflict: 'user_id,period,mode', ignoreDuplicates: true }
        )
        .select('user_id, period, mode, score_value')
        .limit(1);

      if (error) {
        const code = String(error.code || '').trim();
        if (code === '23514' && effectiveMode.startsWith('blitz_')) {
          return upsertBestForPeriod(period, 'blitz');
        }
        if (code !== '42P10') throw toAppError(error);
        if (effectiveMode !== 'global') return null;

        await supabase
          .from('leaderboard_entries')
          .upsert(
            { user_id, period, mode: effectiveMode, score_value: score },
            { onConflict: 'user_id,period', ignoreDuplicates: true }
          )
          .select('user_id, period, mode, score_value')
          .limit(1);

        const { data: legacyUpdated, error: legacyUpdateErr } = await supabase
          .from('leaderboard_entries')
          .update({ score_value: score, mode: effectiveMode })
          .eq('user_id', user_id)
          .eq('period', period)
          .lt('score_value', score)
          .select('user_id, period, mode, score_value')
          .limit(1);
        if (legacyUpdateErr) throw toAppError(legacyUpdateErr);
        if (legacyUpdated?.[0]) return mapLeaderboardRow(legacyUpdated[0]);

        return this.findByUserPeriodMode({ user_id, period, mode: effectiveMode });
      }

      const { data: updated, error: updateErr } = await supabase
        .from('leaderboard_entries')
        .update({ score_value: score })
        .eq('user_id', user_id)
        .eq('period', period)
        .eq('mode', effectiveMode)
        .lt('score_value', score)
        .select('user_id, period, mode, score_value')
        .limit(1);
      if (updateErr) throw toAppError(updateErr);
      if (updated?.[0]) return mapLeaderboardRow(updated[0]);

      return this.findByUserPeriodMode({ user_id, period, mode: effectiveMode });
    };

    const allTime = await upsertBestForPeriod('all_time');
    try {
      await upsertBestForPeriod('weekly');
    } catch {
      // Best-effort: weekly leaderboard should never block gameplay.
    }
    return allTime;
  }
}
