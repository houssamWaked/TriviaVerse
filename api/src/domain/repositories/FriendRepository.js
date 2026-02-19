/**
 * Friends + friend requests repositories.
 *
 * Expected tables:
 *
 * `friend_requests`
 * - id (uuid, primary key, default gen_random_uuid())
 * - from_user_id (uuid, not null)
 * - to_user_id (uuid, not null)
 * - created_at (timestamptz, default now())
 *
 * Unique constraint:
 * - (from_user_id, to_user_id)
 *
 * `friends`
 * - user_id (uuid, not null)
 * - friend_user_id (uuid, not null)
 * - created_at (timestamptz, default now())
 *
 * Unique constraint:
 * - (user_id, friend_user_id)
 *
 * Implementation detail:
 * - When a request is accepted, we insert TWO rows into `friends` (A->B and B->A)
 *   and delete the request.
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

function toAppError(error) {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Already exists', 409, 'DUPLICATE');
  if (code === '42P01') {
    return new AppError('Friends tables are not configured', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

export class FriendRepository {
  async listFriendIdsForUser(userId) {
    const { data, error } = await supabase
      .from('friends')
      .select('friend_user_id')
      .eq('user_id', userId);
    if (error) throw toAppError(error);
    return (data || []).map((r) => r.friend_user_id).filter(Boolean);
  }

  async areFriends(userId, otherUserId) {
    if (!userId || !otherUserId) return false;
    const { data, error } = await supabase
      .from('friends')
      .select('user_id')
      .eq('user_id', userId)
      .eq('friend_user_id', otherUserId)
      .limit(1);
    if (error) throw toAppError(error);
    return !!data?.[0];
  }

  async listIncomingRequests(userId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return data || [];
  }

  async listOutgoingRequests(userId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return data || [];
  }

  async findRequestById(requestId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('id', requestId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async findRequestBetween(fromUserId, toUserId) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async createRequest({ from_user_id, to_user_id }) {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id, to_user_id })
      .select('id, from_user_id, to_user_id, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] || null;
  }

  async deleteRequest(requestId) {
    const { error, count } = await supabase
      .from('friend_requests')
      .delete({ count: 'exact' })
      .eq('id', requestId);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  async createFriendshipPair(userA, userB) {
    const now = new Date().toISOString();
    const rows = [
      { user_id: userA, friend_user_id: userB, created_at: now },
      { user_id: userB, friend_user_id: userA, created_at: now },
    ];
    const { error } = await supabase
      .from('friends')
      .upsert(rows, { onConflict: 'user_id,friend_user_id' });
    if (error) throw toAppError(error);
    return true;
  }
}
