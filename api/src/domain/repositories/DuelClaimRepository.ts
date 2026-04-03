/**
 * Duel claims repository (`duel_claims` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type DuelClaimRow = {
  duel_id: string;
  question_index: number;
  winner_user_id: string;
  answered_ms: number | null;
  created_at: string | null;
};

type CreateDuelClaimInput = Omit<DuelClaimRow, 'created_at'> & { created_at?: string | null };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError('Duel claims table is not configured. Apply `TriviaVerse/api/sql/duels.sql`.', 501, 'NOT_CONFIGURED');
  }
  if (code === '23505') return new AppError('Already claimed', 409, 'CONFLICT');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapDuelClaimRow = (row: unknown): DuelClaimRow => row as unknown as DuelClaimRow;

export class DuelClaimRepository {
  selectFields = 'duel_id, question_index, winner_user_id, answered_ms, created_at';

  async create(payload: CreateDuelClaimInput): Promise<DuelClaimRow | null> {
    const { data, error } = await supabase.from('duel_claims').insert(payload).select(this.selectFields).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapDuelClaimRow(data[0]) : null;
  }

  async findByDuelAndQuestionIndex(duelId: string, questionIndex: number): Promise<DuelClaimRow | null> {
    const { data, error } = await supabase
      .from('duel_claims')
      .select(this.selectFields)
      .eq('duel_id', duelId)
      .eq('question_index', questionIndex)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapDuelClaimRow(data[0]) : null;
  }
}
