/**
 * Millionaire ladder repository (`millionaire_ladders` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type MillionaireLadderRow = {
  id: string;
  name: string;
  checkpoint_questions_json: unknown;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Millionaire ladders table is not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapLadderRow = (row: unknown): MillionaireLadderRow => row as unknown as MillionaireLadderRow;

export class MillionaireLadderRepository {
  async listAll(): Promise<MillionaireLadderRow[]> {
    const { data, error } = await supabase
      .from('millionaire_ladders')
      .select('id, name, checkpoint_questions_json');
    if (error) throw toAppError(error);
    return (data || []).map(mapLadderRow);
  }

  async findById(id: string): Promise<MillionaireLadderRow | null> {
    const { data, error } = await supabase
      .from('millionaire_ladders')
      .select('id, name, checkpoint_questions_json')
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapLadderRow(data[0]) : null;
  }
}
