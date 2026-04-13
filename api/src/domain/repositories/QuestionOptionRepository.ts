/**
 * Question option repository (`question_options` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuestionOptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number | null;
};

type CreateQuestionOptionInput = Omit<QuestionOptionRow, 'id'> & { id?: string };
type UpdateQuestionOptionInput = Partial<Omit<QuestionOptionRow, 'id' | 'question_id'>>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields = 'id, question_id, option_text, is_correct, order_index';
const mapOptionRow = (row: unknown): QuestionOptionRow => row as unknown as QuestionOptionRow;

/**
 * Repository for reading/writing `question_options` rows.
 */
export class QuestionOptionRepository {
  /**
   * Find an option by id.
   * @param id Option id.
   * @returns Option row or `null`.
   */
  async findById(id: string): Promise<QuestionOptionRow | null> {
    const { data, error } = await supabase.from('question_options').select(selectFields).eq('id', id).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapOptionRow(data[0]) : null;
  }

  /**
   * List options for a single question.
   * @param questionId Question id.
   * @returns Array of option rows ordered by `order_index`.
   */
  async listByQuestionId(questionId: string): Promise<QuestionOptionRow[]> {
    const { data, error } = await supabase
      .from('question_options')
      .select(selectFields)
      .eq('question_id', questionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapOptionRow);
  }

  /**
   * List options for multiple question ids.
   * @param questionIds Question ids.
   * @returns Array of option rows ordered by question then option order.
   */
  async listByQuestionIds(questionIds: string[] = []): Promise<QuestionOptionRow[]> {
    const ids = questionIds.filter(Boolean);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('question_options')
      .select(selectFields)
      .in('question_id', ids)
      .order('question_id', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapOptionRow);
  }

  /**
   * Create an option row.
   * @param payload Insert payload.
   * @returns Created option row or `null`.
   */
  async create(payload: CreateQuestionOptionInput): Promise<QuestionOptionRow | null> {
    const { data, error } = await supabase
      .from('question_options')
      .insert(payload)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapOptionRow(data[0]) : null;
  }

  /**
   * Bulk-create option rows.
   * @param rows Insert rows.
   * @returns Created option rows.
   */
  async createMany(rows: CreateQuestionOptionInput[]): Promise<QuestionOptionRow[]> {
    const items = Array.isArray(rows) ? rows : [];
    if (items.length === 0) return [];

    const { data, error } = await supabase.from('question_options').insert(items).select(selectFields);
    if (error) throw toAppError(error);
    return (data || []).map(mapOptionRow);
  }

  /**
   * Patch an option row by id.
   * @param id Option id.
   * @param patch Patch payload.
   * @returns Updated option row or `null`.
   */
  async update(id: string, patch: UpdateQuestionOptionInput): Promise<QuestionOptionRow | null> {
    const { data, error } = await supabase
      .from('question_options')
      .update(patch)
      .eq('id', id)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapOptionRow(data[0]) : null;
  }

  /**
   * Delete an option by id.
   * @param id Option id.
   * @returns `true` if a row was deleted.
   */
  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('question_options').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * Delete all options for a question.
   * @param questionId Question id.
   * @returns `true` on success.
   */
  async deleteByQuestionId(questionId: string): Promise<true> {
    const { error } = await supabase.from('question_options').delete().eq('question_id', questionId);
    if (error) throw toAppError(error);
    return true;
  }

  /**
   * Delete all options for a set of questions.
   * @param questionIds Question ids.
   * @returns `true` on success.
   */
  async deleteByQuestionIds(questionIds: string[] = []): Promise<true> {
    const ids = Array.from(new Set(questionIds.filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase.from('question_options').delete().in('question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
