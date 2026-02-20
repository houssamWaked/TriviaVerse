/**
 * Blitz matchmaking queue repository (`blitz_matchmaking_queue` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Blitz matchmaking is not configured. Apply `TriviaVerse/api/sql/010_blitz_matchmaking_queue.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '23505') {
    return new AppError('Already queued', 409, 'CONFLICT');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class BlitzMatchmakingQueueRepository {
  selectFields = 'id, user_id, category_id, difficulty, status, duel_id, created_at, updated_at';

  async findById(id) {
    const rid = String(id || '').trim();
    if (!rid) return null;
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('id', rid)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findActiveByUserId(userId) {
    const uid = String(userId || '').trim();
    if (!uid) return null;
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('user_id', uid)
      .in('status', ['queued', 'matching'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async create({ user_id, category_id = null, difficulty }) {
    const payload = {
      user_id,
      category_id: category_id ?? null,
      difficulty: String(difficulty || '')
        .trim()
        .toLowerCase(),
      status: 'queued',
      duel_id: null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findCandidate({ excludeUserId, category_id = null, difficulty, minCreatedAt = null }) {
    const q = supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('status', 'queued')
      .eq(
        'difficulty',
        String(difficulty || '')
          .trim()
          .toLowerCase()
      )
      .neq('user_id', String(excludeUserId || '').trim())
      .order('created_at', { ascending: true })
      .limit(1);

    if (category_id) q.eq('category_id', String(category_id).trim());
    else q.is('category_id', null);

    if (minCreatedAt) q.gte('created_at', String(minCreatedAt));

    const { data, error } = await q;
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async claimMatching(id) {
    const rid = String(id || '').trim();
    if (!rid) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'matching', updated_at: now })
      .eq('id', rid)
      .eq('status', 'queued')
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async markMatched(id, duelId) {
    const rid = String(id || '').trim();
    const did = String(duelId || '').trim();
    if (!rid) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'matched', duel_id: did || null, updated_at: now })
      .eq('id', rid)
      .in('status', ['queued', 'matching'])
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async cancel(id, userId) {
    const rid = String(id || '').trim();
    const uid = String(userId || '').trim();
    if (!rid || !uid) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'canceled', updated_at: now })
      .eq('id', rid)
      .eq('user_id', uid)
      .in('status', ['queued', 'matching'])
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }
}
