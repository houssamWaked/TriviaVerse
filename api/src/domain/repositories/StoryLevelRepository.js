/**
 * Story level repository (`story_levels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') {
    return new AppError('Level already exists', 409, 'DUPLICATE');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class StoryLevelRepository {
  async listAll() {
    const { data, error } = await supabase
      .from('story_levels')
      .select('id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward')
      .order('level_number', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByLevelNumber(levelNumber) {
    const { data, error } = await supabase
      .from('story_levels')
      .select('id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward')
      .eq('level_number', levelNumber)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('story_levels')
      .select('id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward')
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async getMaxLevelNumber() {
    const { data, error } = await supabase
      .from('story_levels')
      .select('level_number')
      .order('level_number', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0]?.level_number ?? null;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('story_levels')
      .insert(payload)
      .select('id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async delete(id) {
    const { error, count } = await supabase
      .from('story_levels')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }
}
