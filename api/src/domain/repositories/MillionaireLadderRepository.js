/**
 * Millionaire ladder repository (`millionaire_ladders` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class MillionaireLadderRepository {
  async listAll() {
    const { data, error } = await supabase
      .from('millionaire_ladders')
      .select('id, name, checkpoint_questions_json');
    if (error) throw toAppError(error);
    return data || [];
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('millionaire_ladders')
      .select('id, name, checkpoint_questions_json')
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}

