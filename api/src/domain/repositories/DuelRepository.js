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
  if (code === '23502') {
    return new AppError(
      'Duels table schema mismatch (NOT NULL constraint). Re-apply `TriviaVerse/api/sql/duels.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
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
  constructor() {
    this._extendedSchema = null;
  }

  baseSelectFields =
    'id, quiz_id, challenger_user_id, opponent_user_id, challenger_session_id, opponent_session_id, status, winner_user_id, started_at, current_index, question_started_at, challenger_points, opponent_points, accepted_at, completed_at, created_at, summary_json';

  extendedSelectFields =
    'id, mode, quiz_id, category_id, difficulty, challenger_user_id, opponent_user_id, challenger_session_id, opponent_session_id, status, winner_user_id, started_at, current_index, question_started_at, challenger_points, opponent_points, accepted_at, completed_at, created_at, summary_json';

  selectFields() {
    if (this._extendedSchema === false) return this.baseSelectFields;
    return this.extendedSelectFields;
  }

  isMissingColumn(error) {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  async create(payload) {
    const res = await supabase
      .from('duels')
      .insert(payload)
      .select(this.selectFields())
      .limit(1);

    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;

      // If caller relies on new columns, fail loudly (needs migration).
      if (
        payload?.mode !== undefined ||
        payload?.category_id !== undefined ||
        payload?.difficulty !== undefined
      ) {
        throw toAppError(res.error);
      }

      const retry = await supabase
        .from('duels')
        .insert(payload)
        .select(this.selectFields())
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] || null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async findById(id) {
    const res = await supabase
      .from('duels')
      .select(this.selectFields())
      .eq('id', id)
      .limit(1);

    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      const retry = await supabase
        .from('duels')
        .select(this.selectFields())
        .eq('id', id)
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] || null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }

  async listByUserId(userId, limit = 50) {
    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const res = await supabase
      .from('duels')
      .select(this.selectFields())
      .or(`challenger_user_id.eq.${userId},opponent_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(lim);

    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      const retry = await supabase
        .from('duels')
        .select(this.selectFields())
        .or(`challenger_user_id.eq.${userId},opponent_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(lim);
      if (retry.error) throw toAppError(retry.error);
      return retry.data || [];
    }

    if (res.error) throw toAppError(res.error);
    return res.data || [];
  }

  async update(id, patch) {
    const res = await supabase
      .from('duels')
      .update(patch)
      .eq('id', id)
      .select(this.selectFields())
      .limit(1);

    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;

      if (patch?.mode !== undefined || patch?.category_id !== undefined || patch?.difficulty !== undefined) {
        throw toAppError(res.error);
      }

      const retry = await supabase
        .from('duels')
        .update(patch)
        .eq('id', id)
        .select(this.selectFields())
        .limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] || null;
    }

    if (res.error) throw toAppError(res.error);
    return res.data?.[0] || null;
  }
}
