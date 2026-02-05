/**
 * Question option repository (`question_options` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class QuestionOptionRepository {
  async findById(id) {
    const { data, error } = await supabase
      .from('question_options')
      .select('id, question_id, option_text, is_correct, order_index')
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listByQuestionId(questionId) {
    const { data, error } = await supabase
      .from('question_options')
      .select('id, question_id, option_text, is_correct, order_index')
      .eq('question_id', questionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async listByQuestionIds(questionIds = []) {
    const ids = (questionIds || []).filter(Boolean);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('question_options')
      .select('id, question_id, option_text, is_correct, order_index')
      .in('question_id', ids)
      .order('question_id', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('question_options')
      .insert(payload)
      .select('id, question_id, option_text, is_correct, order_index')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async update(id, patch) {
    const { data, error } = await supabase
      .from('question_options')
      .update(patch)
      .eq('id', id)
      .select('id, question_id, option_text, is_correct, order_index')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async delete(id) {
    const { error, count } = await supabase
      .from('question_options')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async deleteByQuestionId(questionId) {
    const { error } = await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId);
    if (error) throw toAppError(error);
    return true;
  }
}
