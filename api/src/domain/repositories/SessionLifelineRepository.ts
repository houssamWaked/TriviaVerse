/**
 * Session lifeline repository (`session_lifelines` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type SessionLifelineRow = {
  id: string;
  session_id: string;
  lifeline_type: string;
  used_at: string | null;
  payload_json: unknown;
};

type CreateSessionLifelineInput = Omit<SessionLifelineRow, 'id' | 'used_at'> & { id?: string; used_at?: string | null };

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields = 'id, session_id, lifeline_type, used_at, payload_json';
const mapSessionLifelineRow = (row: unknown): SessionLifelineRow => row as unknown as SessionLifelineRow;

export class SessionLifelineRepository {
  async listBySessionId(sessionId: string): Promise<SessionLifelineRow[]> {
    const { data, error } = await supabase
      .from('session_lifelines')
      .select(selectFields)
      .eq('session_id', sessionId)
      .order('used_at', { ascending: true });
    if (error) throw toAppError(error);
    return (data || []).map(mapSessionLifelineRow);
  }

  async findBySessionAndType(sessionId: string, lifelineType: string): Promise<SessionLifelineRow | null> {
    const { data, error } = await supabase
      .from('session_lifelines')
      .select(selectFields)
      .eq('session_id', sessionId)
      .eq('lifeline_type', lifelineType)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionLifelineRow(data[0]) : null;
  }

  async create(payload: CreateSessionLifelineInput): Promise<SessionLifelineRow | null> {
    const { data, error } = await supabase.from('session_lifelines').insert(payload).select(selectFields).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapSessionLifelineRow(data[0]) : null;
  }
}
