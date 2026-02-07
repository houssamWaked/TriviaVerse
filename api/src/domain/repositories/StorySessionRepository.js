/**
 * Story session repository (`story_sessions` table).
 *
 * This table maps a `game_sessions` row (mode = 'story') to the story level played.
 *
 * Expected schema:
 * - session_id (uuid, primary key) references game_sessions(id) on delete cascade
 * - level_id (uuid) references story_levels(id) on delete cascade
 * - level_number (int)
 * - created_at (timestamptz, default now())
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Story sessions table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class StorySessionRepository {
  async create({ session_id, level_id, level_number }) {
    const { data, error } = await supabase
      .from('story_sessions')
      .insert({ session_id, level_id, level_number })
      .select('session_id, level_id, level_number, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('story_sessions')
      .select('session_id, level_id, level_number, created_at')
      .eq('session_id', sessionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}

