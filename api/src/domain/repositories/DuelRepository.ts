/**
 * Duel repository (`duels` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type DuelRow = {
  id: string;
  mode?: string;
  quiz_id: string | null;
  category_id?: string | null;
  difficulty?: string | null;
  challenger_user_id: string;
  opponent_user_id: string;
  challenger_session_id: string | null;
  opponent_session_id: string | null;
  status: string;
  winner_user_id: string | null;
  started_at: string | null;
  current_index: number | null;
  question_started_at: string | null;
  challenger_points: number | null;
  opponent_points: number | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  summary_json: unknown;
};

type CreateDuelInput = Partial<DuelRow>;
type UpdateDuelInput = Partial<DuelRow>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Duels table is not configured. Apply `TriviaVerse/api/sql/duels.sql`.', 501, 'NOT_CONFIGURED');
  }
  if (code === '23502') {
    return new AppError(
      'Duels table schema mismatch (NOT NULL constraint). Re-apply `TriviaVerse/api/sql/duels.sql`.',
      500,
      'DB_SCHEMA_MISMATCH'
    );
  }
  if (code === '42703') {
    return new AppError('Duels table schema mismatch. Re-apply `TriviaVerse/api/sql/duels.sql`.', 500, 'DB_SCHEMA_MISMATCH');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapDuelRow = (row: unknown): DuelRow => row as unknown as DuelRow;

/**
 * Repository for reading/writing `duels` rows (with fallback for older schema without blitz fields).
 */
export class DuelRepository {
  _extendedSchema: boolean | null;
  baseSelectFields =
    'id, quiz_id, challenger_user_id, opponent_user_id, challenger_session_id, opponent_session_id, status, winner_user_id, started_at, current_index, question_started_at, challenger_points, opponent_points, accepted_at, completed_at, created_at, summary_json';
  extendedSelectFields =
    'id, mode, quiz_id, category_id, difficulty, challenger_user_id, opponent_user_id, challenger_session_id, opponent_session_id, status, winner_user_id, started_at, current_index, question_started_at, challenger_points, opponent_points, accepted_at, completed_at, created_at, summary_json';

  /**
   * Construct the duel repository.
   * @returns A `DuelRepository` instance.
   */
  constructor() {
    this._extendedSchema = null;
  }

  /**
   * Select columns depending on whether the extended schema is supported.
   * @returns Comma-separated column list.
   */
  selectFields(): string {
    return this._extendedSchema === false ? this.baseSelectFields : this.extendedSelectFields;
  }

  /**
   * Detect missing-column schema errors for this table.
   * @param error Supabase error object.
   * @returns `true` when the error indicates a missing column.
   */
  isMissingColumn(error: DatabaseErrorLike): boolean {
    const code = String(error?.code || '').trim();
    return code === '42703';
  }

  /**
   * Create a duel row (best-effort falls back when extended columns are missing).
   * @param payload Insert payload.
   * @returns Created duel row or `null`.
   */
  async create(payload: CreateDuelInput): Promise<DuelRow | null> {
    const res = await supabase.from('duels').insert(payload).select(this.selectFields()).limit(1);
    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      if (payload?.mode !== undefined || payload?.category_id !== undefined || payload?.difficulty !== undefined) {
        throw toAppError(res.error);
      }
      const retry = await supabase.from('duels').insert(payload).select(this.selectFields()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapDuelRow(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapDuelRow(res.data[0]) : null;
  }

  /**
   * Find a duel by id (best-effort falls back when extended columns are missing).
   * @param id Duel id.
   * @returns Duel row or `null`.
   */
  async findById(id: string): Promise<DuelRow | null> {
    const res = await supabase.from('duels').select(this.selectFields()).eq('id', id).limit(1);
    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      const retry = await supabase.from('duels').select(this.selectFields()).eq('id', id).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapDuelRow(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapDuelRow(res.data[0]) : null;
  }

  /**
   * List duels where the user is challenger or opponent.
   * @param userId User id.
   * @param limit Max rows to return.
   * @returns Array of duel rows ordered by newest first.
   */
  async listByUserId(userId: string, limit = 50): Promise<DuelRow[]> {
    const lim = Math.min(100, Math.max(1, Number(limit) || 50));
    const filter = `challenger_user_id.eq.${userId},opponent_user_id.eq.${userId}`;
    const res = await supabase
      .from('duels')
      .select(this.selectFields())
      .or(filter)
      .order('created_at', { ascending: false })
      .limit(lim);
    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      const retry = await supabase
        .from('duels')
        .select(this.selectFields())
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(lim);
      if (retry.error) throw toAppError(retry.error);
      return (retry.data || []).map(mapDuelRow);
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapDuelRow);
  }

  /**
   * Patch a duel row (best-effort falls back when extended columns are missing).
   * @param id Duel id.
   * @param patch Patch payload.
   * @returns Updated duel row or `null`.
   */
  async update(id: string, patch: UpdateDuelInput): Promise<DuelRow | null> {
    const res = await supabase.from('duels').update(patch).eq('id', id).select(this.selectFields()).limit(1);
    if (res.error && this.isMissingColumn(res.error)) {
      this._extendedSchema = false;
      if (patch?.mode !== undefined || patch?.category_id !== undefined || patch?.difficulty !== undefined) {
        throw toAppError(res.error);
      }
      const retry = await supabase.from('duels').update(patch).eq('id', id).select(this.selectFields()).limit(1);
      if (retry.error) throw toAppError(retry.error);
      return retry.data?.[0] ? mapDuelRow(retry.data[0]) : null;
    }
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapDuelRow(res.data[0]) : null;
  }
}
