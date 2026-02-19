/**
 * Classic session repository (`classic_sessions` table).
 *
 * Maps a `game_sessions` row (mode = 'classic') to the classic category + level played.
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Classic sessions table is not configured. Apply `TriviaVerse/api/sql/009_classic_category_levels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class ClassicSessionRepository {
  async create({ session_id, category_id, level_id, level_number }) {
    const { data, error } = await supabase
      .from('classic_sessions')
      .insert({ session_id, category_id, level_id, level_number })
      .select('session_id, category_id, level_id, level_number, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('classic_sessions')
      .select('session_id, category_id, level_id, level_number, created_at')
      .eq('session_id', sessionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async deleteByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return true;

    const { error } = await supabase.from('classic_sessions').delete().eq('level_id', lid);
    if (error) throw toAppError(error);
    return true;
  }
}
