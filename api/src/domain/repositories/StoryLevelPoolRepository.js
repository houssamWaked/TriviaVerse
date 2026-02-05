/**
 * Story level pool repository (`story_level_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class StoryLevelPoolRepository {
  async listQuestionIdsByLevelId(levelId) {
    const { data, error } = await supabase
      .from('story_level_pool')
      .select('quiz_question_id')
      .eq('level_id', levelId);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }
}

