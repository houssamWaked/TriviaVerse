/**
 * Story level pool repository (`story_level_pool` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Story level pool table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class StoryLevelPoolRepository {
  async listAllQuestionIds() {
    const { data, error } = await supabase.from('story_level_pool').select('quiz_question_id');
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async listAssignmentsByQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('story_level_pool')
      .select('level_id, quiz_question_id')
      .in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return data || [];
  }

  async listQuestionIdsByLevelId(levelId) {
    const { data, error } = await supabase
      .from('story_level_pool')
      .select('quiz_question_id')
      .eq('level_id', levelId);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async listQuestionIdsByLevelIdPaged(levelId, { limit = 50, offset = 0 } = {}) {
    const lid = String(levelId || '').trim();
    if (!lid) return [];

    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    const { data, error } = await supabase
      .from('story_level_pool')
      .select('quiz_question_id')
      .eq('level_id', lid)
      .range(off, off + lim - 1);

    if (error) throw toAppError(error);
    return (data || []).map((r) => r.quiz_question_id).filter(Boolean);
  }

  async upsertMany(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return true;

    const rows = ids.map((qid) => ({ level_id: lid, quiz_question_id: qid }));
    const { error } = await supabase
      .from('story_level_pool')
      .upsert(rows, { onConflict: 'level_id,quiz_question_id' });
    if (error) throw toAppError(error);
    return true;
  }

  async deleteMany(levelId, questionIds = []) {
    const lid = String(levelId || '').trim();
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (!lid || ids.length === 0) return true;

    const { error } = await supabase
      .from('story_level_pool')
      .delete()
      .eq('level_id', lid)
      .in('quiz_question_id', ids);

    if (error) throw toAppError(error);
    return true;
  }

  async deleteAllByLevelId(levelId) {
    const lid = String(levelId || '').trim();
    if (!lid) return true;

    const { error } = await supabase.from('story_level_pool').delete().eq('level_id', lid);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuizQuestionIds(questionIds = []) {
    const ids = Array.from(new Set((questionIds || []).filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase.from('story_level_pool').delete().in('quiz_question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
