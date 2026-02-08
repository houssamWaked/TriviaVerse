/**
 * Typed-ish API calls (one function per backend route).
 *
 * Conventions:
 * - Functions return `data` (Axios response body)
 * - Auth-required endpoints rely on the token set via `setAuthToken()`
 */
import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cacheGet, cacheSet, essentialCacheGet, essentialCacheSet } from '@/utils/webCache';
import { getCurrentUser } from './userStore';

function stableParamsString(params) {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [String(k), v == null ? '' : String(v)]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

async function cachedGet(
  url,
  { params, ttlMs = 60_000, scope = 'public', prefer = 'localStorage', cache = 'essential' } = {}
) {
  const u = String(url || '');
  const userId = scope === 'user' ? String(getCurrentUser()?.id || 'anon') : 'public';
  const key = `${scope}:${userId}:${u}?${stableParamsString(params)}`;

  const useEssential = cache === 'essential' || cache === 'auto';
  const get = useEssential ? essentialCacheGet : cacheGet;
  const set = useEssential ? essentialCacheSet : cacheSet;

  const hit = get(key);
  if (hit !== null) return hit;

  const res = await http.get(u, params ? { params } : undefined);
  set(key, res.data, { ttlMs, prefer });
  return res.data;
}

export const api = {
  // public
  getHomeMetrics: async () =>
    cachedGet(endpoints.homeMetrics(), {
      ttlMs: 6 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getTopQuizzes: async (limit = 20) =>
    cachedGet(endpoints.publicQuizTop(), {
      params: { limit },
      ttlMs: 10 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  searchQuizzes: async (q, limit = 30) =>
    (
      await http.get(endpoints.publicQuizSearch(), {
        params: { q, limit },
      })
    ).data,
  getPublicQuiz: async (quizId) =>
    cachedGet(endpoints.publicQuizById(quizId), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getPublicQuizRatings: async (quizId) =>
    cachedGet(endpoints.publicQuizRatings(quizId), {
      ttlMs: 5 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getPublicQuizLeaderboard: async (quizId, limit = 20) =>
    cachedGet(endpoints.publicQuizLeaderboard(quizId), {
      params: { limit },
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),

  // auth
  register: async (body) => (await http.post(endpoints.register(), body)).data,
  login: async (body) => (await http.post(endpoints.login(), body)).data,
  logout: async () => (await http.post(endpoints.logout(), {})).data,
  verifyEmail: async (body) => (await http.post(endpoints.verifyEmail(), body)).data,
  resendVerification: async (body) => (await http.post(endpoints.resendVerification(), body)).data,

  // leaderboard
  getLeaderboard: async (params) =>
    cachedGet(endpoints.leaderboard(), {
      params,
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),

  // categories
  listCategories: async () =>
    cachedGet(endpoints.publicCategories(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  searchCategories: async (q) =>
    cachedGet(endpoints.publicCategorySearch(), {
      params: { q },
      ttlMs: 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getCategory: async (id) =>
    cachedGet(endpoints.publicCategoryById(id), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getCategoryStats: async (id) =>
    cachedGet(endpoints.publicCategoryStats(id), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  createCategory: async (body) =>
    (await http.post(endpoints.categories(), body)).data,
  updateCategory: async (id, body) =>
    (await http.put(endpoints.categoryById(id), body)).data,
  deleteCategory: async (id) =>
    (await http.delete(endpoints.categoryById(id))).data,

  // story
  getStoryLevels: async () =>
    cachedGet(endpoints.storyLevels(), { ttlMs: 24 * 60 * 60_000, scope: 'user', prefer: 'localStorage' }),
  getStoryProgress: async () =>
    cachedGet(endpoints.storyProgress(), { ttlMs: 60_000, scope: 'user', prefer: 'localStorage' }),
  startStorySession: async (body) =>
    (await http.post(endpoints.storyStart(), body)).data,

  // millionaire
  getMillionaireConfig: async () =>
    cachedGet(endpoints.millionaireConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  startMillionaireSession: async (body) =>
    (await http.post(endpoints.millionaireStart(), body)).data,

  // classic
  startClassicSession: async (body) =>
    (await http.post(endpoints.classicStart(), body)).data,

  // blitz
  getBlitzConfig: async () =>
    cachedGet(endpoints.blitzConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  startBlitzSession: async (body) =>
    (await http.post(endpoints.blitzStart(), body)).data,

  // sessions
  getCurrentQuestion: async (sessionId) =>
    (await http.get(endpoints.sessionCurrent(sessionId))).data,
  submitAnswer: async (sessionId, body) =>
    (await http.post(endpoints.sessionAnswer(sessionId), body)).data,
  useLifeline: async (sessionId, body) =>
    (await http.post(endpoints.sessionUseLifeline(sessionId), body)).data,
  finishSession: async (sessionId, body) =>
    (await http.post(endpoints.sessionFinish(sessionId), body)).data,

  // quiz builder
  listMyQuizzes: async () =>
    cachedGet(endpoints.quizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  listMyPlayedQuizzes: async () =>
    cachedGet(endpoints.myPlayedQuizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  createQuiz: async (body) => (await http.post(endpoints.quizzes(), body)).data,
  getQuiz: async (quizId) =>
    cachedGet(endpoints.quizById(quizId), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  patchQuiz: async (quizId, body) =>
    (await http.patch(endpoints.quizById(quizId), body)).data,
  publishQuiz: async (quizId) =>
    (await http.post(endpoints.quizPublish(quizId), {})).data,
  shareQuiz: async (quizId, body) =>
    (await http.post(endpoints.quizShare(quizId), body)).data,
  rateQuiz: async (quizId, body) =>
    (await http.post(endpoints.quizRatings(quizId), body)).data,
  listQuizAccess: async (quizId) =>
    cachedGet(endpoints.quizAccess(quizId), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  addQuizAccess: async (quizId, body) =>
    (await http.post(endpoints.quizAccess(quizId), body)).data,
  removeQuizAccess: async (quizId, userId) =>
    (await http.delete(endpoints.quizAccessUser(quizId, userId))).data,
  startCustomQuizSession: async (quizId) =>
    (await http.post(endpoints.customQuizStart(quizId), {})).data,

  listQuizQuestions: async (quizId) =>
    cachedGet(endpoints.quizQuestions(quizId), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  addQuizQuestion: async (quizId, body) =>
    (await http.post(endpoints.quizQuestions(quizId), body)).data,

  patchQuestion: async (questionId, body) =>
    (await http.patch(endpoints.questionById(questionId), body)).data,
  deleteQuestion: async (questionId) =>
    (await http.delete(endpoints.questionById(questionId))).data,

  addOption: async (questionId, body) =>
    (await http.post(endpoints.questionOptions(questionId), body)).data,
  patchOption: async (optionId, body) =>
    (await http.patch(endpoints.optionById(optionId), body)).data,
  deleteOption: async (optionId) =>
    (await http.delete(endpoints.optionById(optionId))).data,

  // friends
  listFriends: async () =>
    cachedGet(endpoints.friends(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  listFriendRequests: async () =>
    cachedGet(endpoints.friendRequests(), { ttlMs: 60_000, scope: 'user', prefer: 'localStorage' }),
  sendFriendRequest: async (body) =>
    (await http.post(endpoints.friendRequests(), body)).data,
  acceptFriendRequest: async (requestId) =>
    (await http.post(endpoints.friendRequestAccept(requestId), {})).data,
  declineFriendRequest: async (requestId) =>
    (await http.post(endpoints.friendRequestDecline(requestId), {})).data,
  cancelFriendRequest: async (requestId) =>
    (await http.delete(endpoints.friendRequestCancel(requestId))).data,
  getFriendStats: async (friendUserId) =>
    cachedGet(endpoints.friendStats(friendUserId), { ttlMs: 10 * 60_000, scope: 'user', prefer: 'localStorage' }),
  getFriendProfile: async (friendUserId) =>
    cachedGet(endpoints.friendProfile(friendUserId), {
      ttlMs: 10 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  // me
  getMyProfile: async () =>
    cachedGet(endpoints.meProfile(), { ttlMs: 5 * 60_000, scope: 'user', prefer: 'localStorage' }),

  // duels
  listDuels: async () =>
    cachedGet(endpoints.duels(), { ttlMs: 60_000, scope: 'user', prefer: 'localStorage' }),
  createDuel: async (body) => (await http.post(endpoints.duels(), body)).data,
  getDuel: async (duelId) =>
    cachedGet(endpoints.duelById(duelId), { ttlMs: 60_000, scope: 'user', prefer: 'localStorage' }),
  acceptDuel: async (duelId) => (await http.post(endpoints.duelAccept(duelId), {})).data,
  declineDuel: async (duelId) => (await http.post(endpoints.duelDecline(duelId), {})).data,
  cancelDuel: async (duelId) => (await http.post(endpoints.duelCancel(duelId), {})).data,
  getDuelState: async (duelId) =>
    cachedGet(endpoints.duelState(duelId), { ttlMs: 3_000, scope: 'user', prefer: 'localStorage' }),
  duelAnswer: async (duelId, body) => (await http.post(endpoints.duelAnswer(duelId), body)).data,

  // quiz delete
  deleteQuiz: async (quizId) => (await http.delete(endpoints.quizById(quizId))).data,

  // admin
  adminListStoryLevels: async () =>
    cachedGet(endpoints.adminStoryLevels(), { ttlMs: 10_000, scope: 'user', prefer: 'localStorage' }),
  adminStoryAssignedQuestionIds: async () =>
    cachedGet(endpoints.adminStoryAssignedQuestionIds(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminCreateStoryLevel: async (body) =>
    (await http.post(endpoints.adminCreateStoryLevel(), body)).data,
  adminDeleteStoryLevel: async (levelId) =>
    (await http.delete(endpoints.adminDeleteStoryLevel(levelId))).data,
  adminAddStoryLevelPool: async (levelId, body) =>
    (await http.post(endpoints.adminAddStoryLevelPool(levelId), body)).data,
  adminSeedStoryLevelPool: async (levelId, body) =>
    (await http.post(endpoints.adminSeedStoryLevelPool(levelId), body)).data,
  adminCreateGlobalQuestion: async (body) =>
    (await http.post(endpoints.adminCreateGlobalQuestion(), body)).data,
  adminListGlobalQuestions: async (params) =>
    cachedGet(endpoints.adminListGlobalQuestions(), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminSearchGlobalQuestions: async (q, limit = 20) =>
    cachedGet(endpoints.adminSearchGlobalQuestions(), {
      params: { q, limit },
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminDeleteGlobalQuestion: async (questionId) =>
    (await http.delete(endpoints.adminDeleteGlobalQuestion(questionId))).data,
  adminModePoolSummary: async (mode) =>
    cachedGet(endpoints.adminModePoolSummary(mode), { ttlMs: 10_000, scope: 'user', prefer: 'localStorage' }),
  adminModePoolIds: async (mode) =>
    cachedGet(endpoints.adminModePoolIds(mode), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminSeedModePool: async (mode, body) =>
    (await http.post(endpoints.adminSeedModePool(mode), body)).data,
  adminListModePoolQuestions: async (mode, params) =>
    cachedGet(endpoints.adminModePoolQuestions(mode), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAddModePool: async (mode, body) =>
    (await http.post(endpoints.adminModePoolSummary(mode), body)).data,
  adminRemoveModePool: async (mode, body) =>
    (await http.delete(endpoints.adminRemoveModePool(mode), { data: body })).data,
  adminReplaceModePool: async (mode, body) =>
    (await http.put(endpoints.adminReplaceModePool(mode), body)).data,
  adminListStoryLevelPoolQuestions: async (levelId, params) =>
    cachedGet(endpoints.adminStoryLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminStoryLevelPoolIds: async (levelId) =>
    cachedGet(endpoints.adminStoryLevelPoolIds(levelId), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminRemoveStoryLevelPool: async (levelId, body) =>
    (await http.delete(endpoints.adminRemoveStoryLevelPool(levelId), { data: body })).data,
  adminReplaceStoryLevelPool: async (levelId, body) =>
    (await http.put(endpoints.adminReplaceStoryLevelPool(levelId), body)).data,

  // classic categories
  adminListClassicCategories: async () =>
    cachedGet(endpoints.adminClassicCategories(), { ttlMs: 20_000, scope: 'user', prefer: 'localStorage' }),
  adminCreateClassicCategory: async (body) =>
    (await http.post(endpoints.adminCreateClassicCategory(), body)).data,
  adminDeleteClassicCategory: async (categoryId) =>
    (await http.delete(endpoints.adminDeleteClassicCategory(categoryId))).data,
  adminListClassicCategoryPoolQuestions: async (categoryId, params) =>
    cachedGet(endpoints.adminClassicCategoryPoolQuestions(categoryId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminClassicCategoryPoolIds: async (categoryId) =>
    cachedGet(endpoints.adminClassicCategoryPoolIds(categoryId), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminAddClassicCategoryPool: async (categoryId, body) =>
    (await http.post(endpoints.adminAddClassicCategoryPool(categoryId), body)).data,
  adminRemoveClassicCategoryPool: async (categoryId, body) =>
    (await http.delete(endpoints.adminRemoveClassicCategoryPool(categoryId), { data: body })).data,
  adminReplaceClassicCategoryPool: async (categoryId, body) =>
    (await http.put(endpoints.adminReplaceClassicCategoryPool(categoryId), body)).data,
  adminSeedClassicCategoryPool: async (categoryId, body) =>
    (await http.post(endpoints.adminSeedClassicCategoryPool(categoryId), body)).data,
};
