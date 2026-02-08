/**
 * Duel repository (`duels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Duels table is not configured. Apply `TriviaVerse/api/sql/duels.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '42703') {
    return new AppError(
      'Duels table schema mismatch. Re-apply `TriviaVerse/api/sql/duels.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class DuelRepository {
  selectFields =
    'id, quiz_id, challenger_user_id, opponent_user_id, challenger_session_id, opponent_session_id, status, winner_user_id, started_at, current_index, question_started_at, challenger_points, opponent_points, accepted_at, completed_at, created_at, summary_json';

  async create(payload) {
    const { data, error } = await supabase
      .from('duels')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('duels')
      .select(this.selectFields)
      .eq('id', id)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async listByUserId(userId, limit = 50) {
    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const { data, error } = await supabase
      .from('duels')
      .select(this.selectFields)
      .or(`challenger_user_id.eq.${userId},opponent_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(lim);
    if (error) throw toAppError(error);
    return data || [];
  }

  async update(id, patch) {
    const { data, error } = await supabase
      .from('duels')
      .update(patch)
      .eq('id', id)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
