import { http } from './httpClient';
import { endpoints } from './endpoints';
import { cachedGet, invalidatePublicCacheByPathPrefix } from './shared';

type LeaderboardQuery = Record<string, string | number | boolean | null | undefined>;

/**
 * Public API wrapper for calling `/api/public/*` endpoints.
 *
 * Most read endpoints use `cachedGet` to reduce repeated network calls.
 */
export const publicApi = {
  /**
   * Get lightweight home metrics (long TTL).
   * @returns Promise resolving to home metrics payload.
   */
  getHomeMetrics: async () =>
    cachedGet(endpoints.homeMetrics(), {
      ttlMs: 6 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Get top quizzes ordered by popularity/ratings (cached).
   * @param limit Max number of quizzes to return.
   * @returns Promise resolving to top quizzes payload.
   */
  getTopQuizzes: async (limit = 20) =>
    cachedGet(endpoints.publicQuizTop(), {
      params: { limit },
      ttlMs: 10 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Search public quizzes by text query.
   * @param q Search text.
   * @param limit Max results.
   * @returns Promise resolving to search results payload.
   */
  searchQuizzes: async (q: string, limit = 30) =>
    (
      await http.get(endpoints.publicQuizSearch(), {
        params: { q, limit },
      })
    ).data,
  /**
   * Get a public quiz details payload (cached).
   * @param quizId Quiz id.
   * @returns Promise resolving to quiz details payload.
   */
  getPublicQuiz: async (quizId: string) =>
    cachedGet(endpoints.publicQuizById(quizId), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Get rating summary for a public quiz (cached).
   * @param quizId Quiz id.
   * @returns Promise resolving to ratings summary payload.
   */
  getPublicQuizRatings: async (quizId: string) =>
    cachedGet(endpoints.publicQuizRatings(quizId), {
      ttlMs: 5 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Get the public leaderboard for a quiz (cached).
   * @param quizId Quiz id.
   * @param limit Max entries.
   * @returns Promise resolving to leaderboard payload.
   */
  getPublicQuizLeaderboard: async (quizId: string, limit = 20) =>
    cachedGet(endpoints.publicQuizLeaderboard(quizId), {
      params: { limit },
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Invalidate cached leaderboard entries for a quiz.
   * @param quizId Quiz id.
   * @returns `true` for convenience.
   */
  invalidatePublicQuizLeaderboard: (quizId: string) => {
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/leaderboard`);
    return true;
  },
  /**
   * Get the global leaderboard for a period/mode (cached).
   * @param params Leaderboard query params.
   * @returns Promise resolving to leaderboard payload.
   */
  getLeaderboard: async (params: LeaderboardQuery) =>
    cachedGet(endpoints.leaderboard(), {
      params,
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * List trivia categories (cached).
   * @returns Promise resolving to category list payload.
   */
  listCategories: async () =>
    cachedGet(endpoints.publicCategories(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Get category stats (cached).
   * @param id Category id.
   * @returns Promise resolving to stats payload.
   */
  getCategoryStats: async (id: string) =>
    cachedGet(endpoints.publicCategoryStats(id), {
      ttlMs: 30 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
};
