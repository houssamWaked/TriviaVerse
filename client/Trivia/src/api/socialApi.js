import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cachedGet, invalidateUserCacheByPathPrefix } from './shared';

export const socialApi = {
  listFriends: async () => (await http.get(endpoints.friends())).data,
  listFriendRequests: async () => (await http.get(endpoints.friendRequests())).data,
  sendFriendRequest: async (body) => {
    const data = (await http.post(endpoints.friendRequests(), body)).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  acceptFriendRequest: async (requestId) => {
    const data = (await http.post(endpoints.friendRequestAccept(requestId), {})).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  declineFriendRequest: async (requestId) => {
    const data = (await http.post(endpoints.friendRequestDecline(requestId), {})).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  cancelFriendRequest: async (requestId) => {
    const data = (await http.delete(endpoints.friendRequestCancel(requestId))).data;
    invalidateUserCacheByPathPrefix('/api/friends');
    return data;
  },
  getFriendProfile: async (friendUserId) =>
    cachedGet(endpoints.friendProfile(friendUserId), {
      ttlMs: 10 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  getMyProfile: async () =>
    cachedGet(endpoints.meProfile(), { ttlMs: 5 * 60_000, scope: 'user', prefer: 'localStorage' }),
  listDuels: async () =>
    cachedGet(endpoints.duels(), { ttlMs: 3_000, scope: 'user', prefer: 'localStorage' }),
  listDuelsFresh: async () => (await http.get(endpoints.duels())).data,
  createDuel: async (body) => {
    const data = (await http.post(endpoints.duels(), body)).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  acceptDuel: async (duelId) => {
    const data = (await http.post(endpoints.duelAccept(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  declineDuel: async (duelId) => {
    const data = (await http.post(endpoints.duelDecline(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  cancelDuel: async (duelId) => {
    const data = (await http.post(endpoints.duelCancel(duelId), {})).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  getDuelState: async (duelId) =>
    cachedGet(endpoints.duelState(duelId), { ttlMs: 3_000, scope: 'user', prefer: 'localStorage' }),
  duelAnswer: async (duelId, body) => {
    const data = (await http.post(endpoints.duelAnswer(duelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
};
