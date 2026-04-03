/**
 * Story level repository (`story_levels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type StoryLevelRow = {
  id: string;
  level_number: number;
  title: string;
  difficulty_min: number | null;
  difficulty_max: number | null;
  pass_score_min: number | null;
  xp_reward: number | null;
};

type CreateStoryLevelInput = Omit<StoryLevelRow, 'id'> & { id?: string };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') {
    return new AppError('Level already exists', 409, 'DUPLICATE');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward';
const mapStoryLevelRow = (row: unknown): StoryLevelRow => row as unknown as StoryLevelRow;

export class StoryLevelRepository {
  async listAll(): Promise<StoryLevelRow[]> {
    const { data, error } = await supabase
      .from('story_levels')
      .select(selectFields)
      .order('level_number', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapStoryLevelRow);
  }

  async findByLevelNumber(levelNumber: number): Promise<StoryLevelRow | null> {
    const { data, error } = await supabase
      .from('story_levels')
      .select(selectFields)
      .eq('level_number', levelNumber)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStoryLevelRow(data[0]) : null;
  }

  async findById(id: string): Promise<StoryLevelRow | null> {
    const { data, error } = await supabase.from('story_levels').select(selectFields).eq('id', id).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStoryLevelRow(data[0]) : null;
  }

  async getMaxLevelNumber(): Promise<number | null> {
    const { data, error } = await supabase
      .from('story_levels')
      .select('level_number')
      .order('level_number', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return (data?.[0] as { level_number?: number } | undefined)?.level_number ?? null;
  }

  async create(payload: CreateStoryLevelInput): Promise<StoryLevelRow | null> {
    const { data, error } = await supabase
      .from('story_levels')
      .insert(payload)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapStoryLevelRow(data[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('story_levels').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}
