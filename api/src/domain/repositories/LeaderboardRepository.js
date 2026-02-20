/**
 * Leaderboard repository (`leaderboard_entries` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
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

export class LeaderboardRepository {
  async list({ period, mode, limit = 50 }) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('rank_position, user_id, score_value, period, mode')
      .eq('period', period)
      .eq('mode', mode)
      .order('rank_position', { ascending: true, nullsFirst: false })
      .order('score_value', { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByUserPeriodMode({ user_id, period, mode }) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('user_id, period, mode, score_value')
      .eq('user_id', user_id)
      .eq('period', period)
      .eq('mode', mode)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async insertFromSession({ user_id, mode, score_value }) {
    const score = Math.max(0, Number(score_value) || 0);

    const upsertBestForPeriod = async (period, modeOverride = null) => {
      const effectiveMode = modeOverride || mode;

      // Preferred schema: unique(user_id, period, mode)
      // - We first ensure the row exists (insert-only, ignore duplicates).
      // - Then we update it only if the new score is higher.
      // This avoids "last play overwrites best" races.
      {
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
          if (code === '23514' && String(effectiveMode || '').startsWith('blitz_')) {
            // Back-compat: some DBs only allow mode='blitz' (no per-difficulty modes).
            return upsertBestForPeriod(period, 'blitz');
          }
          if (code !== '42P10') throw toAppError(error);

          // Schema mismatch fallback: unique(user_id, period, mode) missing.
          // Legacy schema (bug): unique(user_id, period) which prevents storing both per-mode and global rows.
          // Fallback behavior for legacy schema: only store `global` rows so gameplay doesn't break.
          if (effectiveMode !== 'global') return null;

          // Ensure legacy row exists (insert-only) then update only if higher.
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
          if (legacyUpdated?.[0]) return legacyUpdated[0];

          return this.findByUserPeriodMode({ user_id, period, mode: effectiveMode });
        }
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
      if (updated?.[0]) return updated[0];

      return this.findByUserPeriodMode({ user_id, period, mode: effectiveMode });
    };

    // Always write all-time. Also write weekly so `/leaderboard?period=weekly` has data.
    const allTime = await upsertBestForPeriod('all_time');
    try {
      await upsertBestForPeriod('weekly');
    } catch (_e) {
      // Best-effort: weekly leaderboard should never break gameplay/all-time recording.
    }
    return allTime;
  }
}
