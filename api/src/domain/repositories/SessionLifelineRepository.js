/**
 * Session lifeline repository (`session_lifelines` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class SessionLifelineRepository {
  async listBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('session_lifelines')
      .select('id, session_id, lifeline_type, used_at, payload_json')
      .eq('session_id', sessionId)
      .order('used_at', { ascending: true });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findBySessionAndType(sessionId, lifelineType) {
    const { data, error } = await supabase
      .from('session_lifelines')
      .select('id, session_id, lifeline_type, used_at, payload_json')
      .eq('session_id', sessionId)
      .eq('lifeline_type', lifelineType)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from('session_lifelines')
      .insert(payload)
      .select('id, session_id, lifeline_type, used_at, payload_json')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
