import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cachedGet, invalidateUserCacheByPathPrefix } from './shared';

/**
 * Social API wrapper for friends and duels (`/api/friends/*`, `/api/duels/*`).
 */
export const socialApi = {
  /**
   * List the current user's friends.
   * @returns Promise resolving to friends list payload.
   */
  listFriends: async () => (await http.get(endpoints.friends())).data,
  /**
   * List incoming/outgoing friend requests.
   * @returns Promise resolving to requests payload.
   */
  listFriendRequests: async () => (await http.get(endpoints.friendRequests())).data,
  /**
   * Send a friend request and invalidate friend caches.
   * @param body Request payload.
   * @returns Promise resolving to send result payload.
   */
  sendFriendRequest: async (body: unknown) => {
    const data = (await http.post(endpoints.friendRequests(), body)).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  /**
   * Accept a friend request and invalidate friend caches.
   * @param requestId Request id.
   * @returns Promise resolving to accept result payload.
   */
  acceptFriendRequest: async (requestId: string) => {
    const data = (await http.post(endpoints.friendRequestAccept(requestId), {})).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  /**
   * Decline a friend request and invalidate friend caches.
   * @param requestId Request id.
   * @returns Promise resolving to decline result payload.
   */
  declineFriendRequest: async (requestId: string) => {
    const data = (await http.post(endpoints.friendRequestDecline(requestId), {})).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  /**
   * Cancel an outgoing friend request and invalidate friend caches.
   * @param requestId Request id.
   * @returns Promise resolving to cancel result payload.
   */
  cancelFriendRequest: async (requestId: string) => {
    const data = (await http.delete(endpoints.friendRequestCancel(requestId))).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  /**
   * Get a friend's profile payload (cached).
   * @param friendUserId Friend user id.
   * @returns Promise resolving to profile payload.
   */
  getFriendProfile: async (friendUserId: string) =>
    cachedGet(endpoints.friendProfile(friendUserId), {
      ttlMs: 10 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Get the current user's profile payload (cached).
   * @returns Promise resolving to profile payload.
   */
  getMyProfile: async () =>
    cachedGet(endpoints.meProfile(), {
      ttlMs: 5 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * List duels for the current user (cached, short TTL).
   * @returns Promise resolving to duel list payload.
   */
  listDuels: async () =>
    cachedGet(endpoints.duels(), { ttlMs: 3_000, scope: 'user', prefer: 'localStorage' }),
  /**
   * List duels without cache.
   * @returns Promise resolving to duel list payload.
   */
  listDuelsFresh: async () => (await http.get(endpoints.duels())).data,
  /**
   * Create a duel challenge and invalidate duel caches.
   * @param body Duel creation payload.
   * @returns Promise resolving to created duel payload.
   */
  createDuel: async (body: unknown) => {
    const data = (await http.post(endpoints.duels(), body)).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  /**
   * Accept a duel and invalidate duel caches.
   * @param duelId Duel id.
   * @returns Promise resolving to updated duel payload.
   */
  acceptDuel: async (duelId: string) => {
    const data = (await http.post(endpoints.duelAccept(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  /**
   * Decline a duel and invalidate duel caches.
   * @param duelId Duel id.
   * @returns Promise resolving to updated duel payload.
   */
  declineDuel: async (duelId: string) => {
    const data = (await http.post(endpoints.duelDecline(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  /**
   * Cancel a duel and invalidate duel caches.
   * @param duelId Duel id.
   * @returns Promise resolving to updated duel payload.
   */
  cancelDuel: async (duelId: string) => {
    const data = (await http.post(endpoints.duelCancel(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  /**
   * Fetch the current live duel state.
   * @param duelId Duel id.
   * @returns Promise resolving to live duel state payload.
   */
  getDuelState: async (duelId: string) =>
    (await http.get(endpoints.duelState(duelId))).data,
  /**
   * Submit a live duel answer and invalidate duel caches.
   * @param duelId Duel id.
   * @param body Answer payload.
   * @returns Promise resolving to updated duel state payload.
   */
  duelAnswer: async (duelId: string, body: unknown) => {
    const data = (await http.post(endpoints.duelAnswer(duelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
};
