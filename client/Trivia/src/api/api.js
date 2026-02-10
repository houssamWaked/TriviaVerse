/**
 * Typed-ish API calls (one function per backend route).
 *
 * Conventions:
 * - Functions return `data` (Axios response body)
 * - Auth-required endpoints rely on the token set via `setAuthToken()`
 */
import { http } from './httpClient';
import { endpoints } from './endpoints';
import {
  cacheGet,
  cacheSet,
  essentialCacheClearByPrefix,
  essentialCacheGet,
  essentialCacheSet,
} from '@/utils/webCache';
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

function getUserId() {
  return String(getCurrentUser()?.id || 'anon');
}

function invalidateUserCacheByPathPrefix(pathPrefix) {
  const prefix = `user:${getUserId()}:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

function invalidatePublicCacheByPathPrefix(pathPrefix) {
  const prefix = `public:public:${String(pathPrefix || '')}`;
  essentialCacheClearByPrefix(prefix);
}

// Quiz builder index so we can invalidate precisely after option/question edits.
const quizBuilderIndex = {
  questionIdToQuizId: new Map(),
  optionIdToQuizId: new Map(),
};

function indexQuizQuestionsForQuiz(quizId, questions) {
  const qid = String(quizId || '').trim();
  if (!qid || !Array.isArray(questions)) return;

  for (const q of questions) {
    if (q?.id) quizBuilderIndex.questionIdToQuizId.set(String(q.id), qid);
    const opts = Array.isArray(q?.options) ? q.options : [];
    for (const o of opts) {
      if (o?.id) quizBuilderIndex.optionIdToQuizId.set(String(o.id), qid);
    }
  }
}

function getQuizIdForQuestionId(questionId) {
  const qid = String(questionId || '').trim();
  if (!qid) return null;
  return quizBuilderIndex.questionIdToQuizId.get(qid) || null;
}

function getQuizIdForOptionId(optionId) {
  const oid = String(optionId || '').trim();
  if (!oid) return null;
  return quizBuilderIndex.optionIdToQuizId.get(oid) || null;
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
  invalidatePublicQuizLeaderboard: (quizId) => {
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/leaderboard`);
    return true;
  },

  // auth
  register: async (body) => (await http.post(endpoints.register(), body)).data,
  login: async (body) => (await http.post(endpoints.login(), body)).data,
  logout: async () => (await http.post(endpoints.logout(), {})).data,
  verifyEmail: async (body) => (await http.post(endpoints.verifyEmail(), body)).data,
  resendVerification: async (body) => (await http.post(endpoints.resendVerification(), body)).data,
  refreshSession: async () => (await http.post(endpoints.refresh(), {})).data,

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
  getSessionReview: async (sessionId) =>
    (await http.get(endpoints.sessionReview(sessionId))).data,
  submitAnswer: async (sessionId, body) =>
    (await http.post(endpoints.sessionAnswer(sessionId), body)).data,
  useLifeline: async (sessionId, body) =>
    (await http.post(endpoints.sessionUseLifeline(sessionId), body)).data,
  finishSession: async (sessionId, body) => {
    const data = (await http.post(endpoints.sessionFinish(sessionId), body)).data;

    // If a custom quiz just finished, its per-quiz leaderboard should update immediately.
    if (data?.status === 'completed' && data?.session?.mode === 'custom' && data?.session?.quiz_id) {
      invalidatePublicCacheByPathPrefix(
        `/api/public/quizzes/${data.session.quiz_id}/leaderboard`
      );
    }

    return data;
  },

  // quiz builder
  listMyQuizzes: async () =>
    cachedGet(endpoints.quizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  listMyPlayedQuizzes: async () =>
    cachedGet(endpoints.myPlayedQuizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  createQuiz: async (body) => {
    const data = (await http.post(endpoints.quizzes(), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    // Home shows global counts (quizzes/questions), so invalidate after writes.
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  getQuiz: async (quizId) =>
    cachedGet(endpoints.quizById(quizId), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  patchQuiz: async (quizId, body) => {
    const data = (await http.patch(endpoints.quizById(quizId), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    return data;
  },
  publishQuiz: async (quizId) => {
    const data = (await http.post(endpoints.quizPublish(quizId), {})).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    return data;
  },
  shareQuiz: async (quizId, body) => {
    const data = (await http.post(endpoints.quizShare(quizId), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    return data;
  },
  rateQuiz: async (quizId, body) => {
    const data = (await http.post(endpoints.quizRatings(quizId), body)).data;
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/ratings`);
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/leaderboard`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  reportQuiz: async (quizId, body) => (await http.post(endpoints.quizReport(quizId), body)).data,
  listQuizAccess: async (quizId) =>
    cachedGet(endpoints.quizAccess(quizId), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  addQuizAccess: async (quizId, body) => {
    const data = (await http.post(endpoints.quizAccess(quizId), body)).data;
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/access`);
    return data;
  },
  removeQuizAccess: async (quizId, userId) => {
    const data = (await http.delete(endpoints.quizAccessUser(quizId, userId))).data;
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/access`);
    return data;
  },
  startCustomQuizSession: async (quizId) =>
    (await http.post(endpoints.customQuizStart(quizId), {})).data,

  listQuizQuestions: async (quizId) =>
    cachedGet(endpoints.quizQuestions(quizId), {
      ttlMs: 2 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }).then((data) => {
      indexQuizQuestionsForQuiz(quizId, data);
      return data;
    }),
  addQuizQuestion: async (quizId, body) => {
    const data = (await http.post(endpoints.quizQuestions(quizId), body)).data;
    if (data?.id) quizBuilderIndex.questionIdToQuizId.set(String(data.id), String(quizId));
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  patchQuestion: async (questionId, body) => {
    const data = (await http.patch(endpoints.questionById(questionId), body)).data;
    const quizId = data?.quiz_id || getQuizIdForQuestionId(questionId);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    return data;
  },
  deleteQuestion: async (questionId) => {
    const quizId = getQuizIdForQuestionId(questionId);
    const data = (await http.delete(endpoints.questionById(questionId))).data;
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    quizBuilderIndex.questionIdToQuizId.delete(String(questionId));
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  addOption: async (questionId, body) => {
    const data = (await http.post(endpoints.questionOptions(questionId), body)).data;
    const quizId = getQuizIdForQuestionId(questionId);
    if (quizId && data?.id) quizBuilderIndex.optionIdToQuizId.set(String(data.id), String(quizId));
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    return data;
  },
  patchOption: async (optionId, body) => {
    const data = (await http.patch(endpoints.optionById(optionId), body)).data;
    const quizId =
      getQuizIdForOptionId(optionId) || getQuizIdForQuestionId(data?.question_id);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    if (quizId && data?.id) quizBuilderIndex.optionIdToQuizId.set(String(data.id), String(quizId));
    return data;
  },
  deleteOption: async (optionId) => {
    const quizId = getQuizIdForOptionId(optionId);
    const data = (await http.delete(endpoints.optionById(optionId))).data;
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    quizBuilderIndex.optionIdToQuizId.delete(String(optionId));
    return data;
  },

  // friends
  // Friends/requests are "live" UX and shouldn't be long-cached.
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
    cachedGet(endpoints.duels(), { ttlMs: 3_000, scope: 'user', prefer: 'localStorage' }),
  // No-cache variant for real-time-ish UI (notifications, pending states).
  listDuelsFresh: async () => (await http.get(endpoints.duels())).data,
  createDuel: async (body) => {
    const data = (await http.post(endpoints.duels(), body)).data;
    invalidateUserCacheByPathPrefix('/api/duels');
    return data;
  },
  getDuel: async (duelId) =>
    cachedGet(endpoints.duelById(duelId), { ttlMs: 60_000, scope: 'user', prefer: 'localStorage' }),
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

  // quiz delete
  deleteQuiz: async (quizId) => {
    const data = (await http.delete(endpoints.quizById(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  // admin
  adminListStoryLevels: async () =>
    cachedGet(endpoints.adminStoryLevels(), { ttlMs: 10_000, scope: 'user', prefer: 'localStorage' }),
  adminStoryAssignedQuestionIds: async () =>
    cachedGet(endpoints.adminStoryAssignedQuestionIds(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminCreateStoryLevel: async (body) => {
    const data = (await http.post(endpoints.adminCreateStoryLevel(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },
  adminDeleteStoryLevel: async (levelId) => {
    const data = (await http.delete(endpoints.adminDeleteStoryLevel(levelId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },
  adminAddStoryLevelPool: async (levelId, body) => {
    const data = (await http.post(endpoints.adminAddStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminSeedStoryLevelPool: async (levelId, body) => {
    const data = (await http.post(endpoints.adminSeedStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminCreateGlobalQuestion: async (body) => {
    const data = (await http.post(endpoints.adminCreateGlobalQuestion(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
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
  adminDeleteGlobalQuestion: async (questionId) => {
    const data = (await http.delete(endpoints.adminDeleteGlobalQuestion(questionId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminModePoolSummary: async (mode) =>
    cachedGet(endpoints.adminModePoolSummary(mode), { ttlMs: 10_000, scope: 'user', prefer: 'localStorage' }),
  adminModePoolIds: async (mode) =>
    cachedGet(endpoints.adminModePoolIds(mode), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminSeedModePool: async (mode, body) => {
    const data = (await http.post(endpoints.adminSeedModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListModePoolQuestions: async (mode, params) =>
    cachedGet(endpoints.adminModePoolQuestions(mode), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAddModePool: async (mode, body) => {
    const data = (await http.post(endpoints.adminModePoolSummary(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminRemoveModePool: async (mode, body) => {
    const data = (await http.delete(endpoints.adminRemoveModePool(mode), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceModePool: async (mode, body) => {
    const data = (await http.put(endpoints.adminReplaceModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListStoryLevelPoolQuestions: async (levelId, params) =>
    cachedGet(endpoints.adminStoryLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminStoryLevelPoolIds: async (levelId) =>
    cachedGet(endpoints.adminStoryLevelPoolIds(levelId), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminRemoveStoryLevelPool: async (levelId, body) => {
    const data = (await http.delete(endpoints.adminRemoveStoryLevelPool(levelId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceStoryLevelPool: async (levelId, body) => {
    const data = (await http.put(endpoints.adminReplaceStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  // classic categories
  adminListClassicCategories: async () =>
    cachedGet(endpoints.adminClassicCategories(), { ttlMs: 20_000, scope: 'user', prefer: 'localStorage' }),
  adminCreateClassicCategory: async (body) => {
    const data = (await http.post(endpoints.adminCreateClassicCategory(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminDeleteClassicCategory: async (categoryId) => {
    const data = (await http.delete(endpoints.adminDeleteClassicCategory(categoryId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListClassicCategoryPoolQuestions: async (categoryId, params) =>
    cachedGet(endpoints.adminClassicCategoryPoolQuestions(categoryId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminClassicCategoryPoolIds: async (categoryId) =>
    cachedGet(endpoints.adminClassicCategoryPoolIds(categoryId), { ttlMs: 15_000, scope: 'user', prefer: 'localStorage' }),
  adminAddClassicCategoryPool: async (categoryId, body) => {
    const data = (await http.post(endpoints.adminAddClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminRemoveClassicCategoryPool: async (categoryId, body) => {
    const data = (await http.delete(endpoints.adminRemoveClassicCategoryPool(categoryId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceClassicCategoryPool: async (categoryId, body) => {
    const data = (await http.put(endpoints.adminReplaceClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminSeedClassicCategoryPool: async (categoryId, body) => {
    const data = (await http.post(endpoints.adminSeedClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  // moderation
  adminListQuizReports: async (params) =>
    cachedGet(endpoints.adminQuizReports(), {
      params,
      ttlMs: 5_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminResolveQuizReport: async (reportId) => {
    const data = (await http.post(endpoints.adminResolveQuizReport(reportId), {})).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
  adminDeleteCustomQuiz: async (quizId) => {
    const data = (await http.delete(endpoints.adminDeleteCustomQuiz(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminBanUser: async (userId, body) => {
    const data = (await http.post(endpoints.adminBanUser(userId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
  adminUnbanUser: async (userId) => {
    const data = (await http.post(endpoints.adminUnbanUser(userId), {})).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
};
