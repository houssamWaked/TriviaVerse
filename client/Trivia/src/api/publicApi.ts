import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cachedGet, invalidatePublicCacheByPathPrefix } from './shared';

type LeaderboardQuery = Record<string, string | number | boolean | null | undefined>;

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
  searchQuizzes: async (q: string, limit = 30) =>
    (
      await http.get(endpoints.publicQuizSearch(), {
        params: { q, limit },
      })
    ).data,
  getPublicQuiz: async (quizId: string) =>
    cachedGet(endpoints.publicQuizById(quizId), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getPublicQuizRatings: async (quizId: string) =>
    cachedGet(endpoints.publicQuizRatings(quizId), {
      ttlMs: 5 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getPublicQuizLeaderboard: async (quizId: string, limit = 20) =>
    cachedGet(endpoints.publicQuizLeaderboard(quizId), {
      params: { limit },
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  invalidatePublicQuizLeaderboard: (quizId: string) => {
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/leaderboard`);
    return true;
  },
  getLeaderboard: async (params: LeaderboardQuery) =>
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
  getCategoryStats: async (id: string) =>
    cachedGet(endpoints.publicCategoryStats(id), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
};
