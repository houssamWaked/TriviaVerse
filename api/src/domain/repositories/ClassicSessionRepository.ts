/**
 * Classic session repository (`classic_sessions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type ClassicSessionRow = {
  session_id: string;
  category_id: string;
  level_id: string | null;
  level_number: number | null;
  created_at: string | null;
};

type CreateClassicSessionInput = Pick<
  ClassicSessionRow,
  'session_id' | 'category_id' | 'level_id' | 'level_number'
>;

function toAppError(error: DatabaseErrorLike): AppError | null {
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

const mapClassicSessionRow = (row: unknown): ClassicSessionRow => row as unknown as ClassicSessionRow;

export class ClassicSessionRepository {
  async create({
    session_id,
    category_id,
    level_id,
    level_number,
  }: CreateClassicSessionInput): Promise<ClassicSessionRow | null> {
    const { data, error } = await supabase
      .from('classic_sessions')
      .insert({ session_id, category_id, level_id, level_number })
      .select('session_id, category_id, level_id, level_number, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapClassicSessionRow(data[0]) : null;
  }

  async findBySessionId(sessionId: string): Promise<ClassicSessionRow | null> {
    const { data, error } = await supabase
      .from('classic_sessions')
      .select('session_id, category_id, level_id, level_number, created_at')
      .eq('session_id', sessionId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapClassicSessionRow(data[0]) : null;
  }

  async deleteByLevelId(levelId: string): Promise<boolean> {
    const normalizedLevelId = String(levelId || '').trim();
    if (!normalizedLevelId) return true;

    const { error } = await supabase.from('classic_sessions').delete().eq('level_id', normalizedLevelId);
    if (error) throw toAppError(error);
    return true;
  }
}
