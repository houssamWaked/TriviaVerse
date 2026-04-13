/**
 * Friends + friend requests repositories.
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string | null;
};

type FriendRow = {
  user_id: string;
  friend_user_id: string;
  created_at: string | null;
};

type CreateFriendRequestInput = Pick<FriendRequestRow, 'from_user_id' | 'to_user_id'>;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '23505') return new AppError('Already exists', 409, 'DUPLICATE');
  if (code === '42P01') return new AppError('Friends tables are not configured', 501, 'NOT_CONFIGURED');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const mapFriendRequestRow = (row: unknown): FriendRequestRow => row as unknown as FriendRequestRow;

/**
 * Repository for friendships and friend request rows.
 */
export class FriendRepository {
  /**
   * List friend user ids for a user.
   * @param userId User id.
   * @returns Array of friend user ids.
   */
  async listFriendIdsForUser(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from('friends').select('friend_user_id').eq('user_id', userId);
    if (error) throw toAppError(error);
    return (data || [])
      .map((row) => (row as { friend_user_id?: string }).friend_user_id)
      .filter((value): value is string => Boolean(value));
  }

  /**
   * Check whether two users are friends.
   * @param userId User id.
   * @param otherUserId Other user id.
   * @returns `true` if a friendship row exists.
   */
  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    if (!userId || !otherUserId) return false;
    const { data, error } = await supabase
      .from('friends')
      .select('user_id')
      .eq('user_id', userId)
      .eq('friend_user_id', otherUserId)
      .limit(1);
    if (error) throw toAppError(error);
    return Boolean(data?.[0]);
  }

  /**
   * List incoming friend requests for a user.
   * @param userId User id (recipient).
   * @returns Array of request rows.
   */
  async listIncomingRequests(userId: string): Promise<FriendRequestRow[]> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return (data || []).map(mapFriendRequestRow);
  }

  /**
   * List outgoing friend requests for a user.
   * @param userId User id (sender).
   * @returns Array of request rows.
   */
  async listOutgoingRequests(userId: string): Promise<FriendRequestRow[]> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return (data || []).map(mapFriendRequestRow);
  }

  /**
   * Find a friend request by id.
   * @param requestId Request id.
   * @returns Request row or `null`.
   */
  async findRequestById(requestId: string): Promise<FriendRequestRow | null> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('id', requestId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapFriendRequestRow(data[0]) : null;
  }

  /**
   * Find a friend request from one user to another.
   * @param fromUserId Sender user id.
   * @param toUserId Recipient user id.
   * @returns Request row or `null`.
   */
  async findRequestBetween(fromUserId: string, toUserId: string): Promise<FriendRequestRow | null> {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, created_at')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapFriendRequestRow(data[0]) : null;
  }

  /**
   * Create a new friend request.
   * @param from_user_id Sender user id.
   * @param to_user_id Recipient user id.
   * @returns Created request row or `null`.
   */
  async createRequest({ from_user_id, to_user_id }: CreateFriendRequestInput): Promise<FriendRequestRow | null> {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id, to_user_id })
      .select('id, from_user_id, to_user_id, created_at')
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapFriendRequestRow(data[0]) : null;
  }

  /**
   * Delete a friend request by id.
   * @param requestId Request id.
   * @returns `true` if a row was deleted.
   */
  async deleteRequest(requestId: string): Promise<boolean> {
    const { error, count } = await supabase.from('friend_requests').delete({ count: 'exact' }).eq('id', requestId);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * Create reciprocal friendship rows for two users.
   * @param userA First user id.
   * @param userB Second user id.
   * @returns `true` on success.
   */
  async createFriendshipPair(userA: string, userB: string): Promise<true> {
    const now = new Date().toISOString();
    const rows: FriendRow[] = [
      { user_id: userA, friend_user_id: userB, created_at: now },
      { user_id: userB, friend_user_id: userA, created_at: now },
    ];
    const { error } = await supabase.from('friends').upsert(rows, { onConflict: 'user_id,friend_user_id' });
    if (error) throw toAppError(error);
    return true;
  }
}
