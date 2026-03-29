import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cachedGet, invalidatePublicCacheByPathPrefix } from './shared';

export const publicApi = {
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
  getLeaderboard: async (params) =>
    cachedGet(endpoints.leaderboard(), {
      params,
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  listCategories: async () =>
    cachedGet(endpoints.publicCategories(), {
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
};
