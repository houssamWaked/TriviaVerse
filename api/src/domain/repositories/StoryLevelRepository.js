/**
 * Story level repository (`story_levels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class StoryLevelRepository {
  async listAll() {
    const { data, error } = await supabase
      .from('story_levels')
      .select(
        'id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward'
      )
      .order('level_number', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findByLevelNumber(levelNumber) {
    const { data, error } = await supabase
      .from('story_levels')
      .select(
        'id, level_number, title, difficulty_min, difficulty_max, pass_score_min, xp_reward'
      )
      .eq('level_number', levelNumber)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}

