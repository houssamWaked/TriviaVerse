/**
 * Story session repository (`story_sessions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type StorySessionRow = {
  session_id: string;
  level_id: string;
  level_number: number;
  created_at: string | null;
};

type CreateStorySessionInput = Pick<StorySessionRow, 'session_id' | 'level_id' | 'level_number'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Story sessions table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields = 'session_id, level_id, level_number, created_at';
const mapStorySessionRow = (row: unknown): StorySessionRow => row as unknown as StorySessionRow;

/**
 * Repository for story session metadata rows (`story_sessions`).
 */
export class StorySessionRepository {
  /**
   * Create a story session row for a game session.
   * @param session_id Game session id.
   * @param level_id Story level id.
   * @param level_number Story level number.
   * @returns Created story session row or `null`.
   */
  async create({ session_id, level_id, level_number }: CreateStorySessionInput): Promise<StorySessionRow | null> {
    const { data, error } = await supabase
      .from('story_sessions')
      .insert({ session_id, level_id, level_number })
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStorySessionRow(data[0]) : null;
  }

  /**
   * Find story metadata by session id.
   * @param sessionId Game session id.
   * @returns Story session row or `null`.
   */
  async findBySessionId(sessionId: string): Promise<StorySessionRow | null> {
    const { data, error } = await supabase
      .from('story_sessions')
      .select(selectFields)
      .eq('session_id', sessionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStorySessionRow(data[0]) : null;
  }

  /**
   * Delete story session rows for a level.
   * @param levelId Story level id.
   * @returns `true` on success.
   */
  async deleteByLevelId(levelId: string): Promise<true> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return true;

    const { error } = await supabase.from('story_sessions').delete().eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return true;
  }
}
