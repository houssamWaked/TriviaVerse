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

export class QuestionOptionRepository {
  async findById(id: string): Promise<QuestionOptionRow | null> {
    const { data, error } = await supabase.from('question_options').select(selectFields).eq('id', id).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapOptionRow(data[0]) : null;
  }

  async listByQuestionId(questionId: string): Promise<QuestionOptionRow[]> {
    const { data, error } = await supabase
      .from('question_options')
      .select(selectFields)
      .eq('question_id', questionId)
      .order('order_index', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapOptionRow);
  }

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

  async create(payload: CreateQuestionOptionInput): Promise<QuestionOptionRow | null> {
    const { data, error } = await supabase
      .from('question_options')
      .insert(payload)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapOptionRow(data[0]) : null;
  }

  async createMany(rows: CreateQuestionOptionInput[]): Promise<QuestionOptionRow[]> {
    const items = Array.isArray(rows) ? rows : [];
    if (items.length === 0) return [];

    const { data, error } = await supabase.from('question_options').insert(items).select(selectFields);
    if (error) throw toAppError(error);
    return (data || []).map(mapOptionRow);
  }

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

  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('question_options').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async deleteByQuestionId(questionId: string): Promise<true> {
    const { error } = await supabase.from('question_options').delete().eq('question_id', questionId);
    if (error) throw toAppError(error);
    return true;
  }

  async deleteByQuestionIds(questionIds: string[] = []): Promise<true> {
    const ids = Array.from(new Set(questionIds.filter(Boolean)));
    if (ids.length === 0) return true;

    const { error } = await supabase.from('question_options').delete().in('question_id', ids);
    if (error) throw toAppError(error);
    return true;
  }
}
