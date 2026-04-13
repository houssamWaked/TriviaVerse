import { http } from './httpClient';
import { endpoints } from './endpoints';
import {
  cachedGet,
  invalidatePublicCacheByPathPrefix,
  invalidateUserCacheByPathPrefix,
} from './shared';

/**
 * Helper type for query-string params passed to admin list endpoints.
 */
type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Admin API wrapper for calling `/api/admin/*` endpoints.
 *
 * Notes:
 * - Read endpoints generally go through `cachedGet` for local caching.
 * - Write endpoints invalidate relevant user/public cache prefixes.
 */
export const adminApi = {
  /**
   * List story level definitions (cached).
   * @returns Promise resolving to the story levels payload.
   */
  adminListStoryLevels: async () =>
    cachedGet(endpoints.adminStoryLevels(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * List all assigned question ids across all pools (cached).
   * @returns Promise resolving to the assigned-id payload.
   */
  adminAllAssignedQuestionIds: async () =>
    cachedGet(endpoints.adminAllAssignedQuestionIds(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Create a story level and invalidate relevant caches.
   * @param body Story level creation payload.
   * @returns Promise resolving to the created level payload.
   */
  adminCreateStoryLevel: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateStoryLevel(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },

  /**
   * Delete a story level and invalidate relevant caches.
   * @param levelId Story level id.
   * @returns Promise resolving to the delete result payload.
   */
  adminDeleteStoryLevel: async (levelId: string) => {
    const data = (await http.delete(endpoints.adminDeleteStoryLevel(levelId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },

  /**
   * Add question ids to a story level pool and invalidate admin caches.
   * @param levelId Story level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the add result payload.
   */
  adminAddStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Seed a story level pool with random questions and invalidate admin caches.
   * @param levelId Story level id.
   * @param body Seed parameters payload.
   * @returns Promise resolving to the seed result payload.
   */
  adminSeedStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Create a new global question and invalidate admin/public caches.
   * @param body Question creation payload.
   * @returns Promise resolving to the created question payload.
   */
  adminCreateGlobalQuestion: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateGlobalQuestion(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  /**
   * List global questions with paging/filter params (cached).
   * @param params Query params (search/paging/assigned).
   * @returns Promise resolving to the questions list payload.
   */
  adminListGlobalQuestions: async (params: QueryParams) =>
    cachedGet(endpoints.adminListGlobalQuestions(), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Get a single global question by id.
   * @param questionId Question id.
   * @returns Promise resolving to the question payload.
   */
  adminGetGlobalQuestion: async (questionId: string) =>
    (await http.get(endpoints.adminGlobalQuestionById(questionId))).data,

  /**
   * Patch a global question and invalidate admin/public caches.
   * @param questionId Question id.
   * @param body Patch payload.
   * @returns Promise resolving to the updated question payload.
   */
  adminPatchGlobalQuestion: async (questionId: string, body: unknown) => {
    const data = (await http.patch(endpoints.adminGlobalQuestionById(questionId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  /**
   * Replace all options for a global question and invalidate admin caches.
   * @param questionId Question id.
   * @param body Replacement payload.
   * @returns Promise resolving to the updated options payload.
   */
  adminReplaceGlobalQuestionOptions: async (questionId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceGlobalQuestionOptions(questionId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Delete a global question and invalidate admin/public caches.
   * @param questionId Question id.
   * @returns Promise resolving to the delete result payload.
   */
  adminDeleteGlobalQuestion: async (questionId: string) => {
    const data = (await http.delete(endpoints.adminDeleteGlobalQuestion(questionId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  /**
   * Get a mode pool summary (cached).
   * @param mode Mode name.
   * @returns Promise resolving to the mode pool summary payload.
   */
  adminModePoolSummary: async (mode: string) =>
    cachedGet(endpoints.adminModePoolSummary(mode), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * List all question ids assigned to a mode pool (cached).
   * @param mode Mode name.
   * @returns Promise resolving to the id list payload.
   */
  adminModePoolIds: async (mode: string) =>
    cachedGet(endpoints.adminModePoolIds(mode), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Seed a mode pool and invalidate admin caches.
   * @param mode Mode name.
   * @param body Seed parameters payload.
   * @returns Promise resolving to the seed result payload.
   */
  adminSeedModePool: async (mode: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List mode pool questions with paging/filter params (cached).
   * @param mode Mode name.
   * @param params Query params (search/paging/assigned).
   * @returns Promise resolving to the questions list payload.
   */
  adminListModePoolQuestions: async (mode: string, params: QueryParams) =>
    cachedGet(endpoints.adminModePoolQuestions(mode), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Add questions to a mode pool and invalidate admin caches.
   * @param mode Mode name.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the add result payload.
   */
  adminAddModePool: async (mode: string, body: unknown) => {
    const data = (await http.post(endpoints.adminModePoolSummary(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Remove questions from a mode pool and invalidate admin caches.
   * @param mode Mode name.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the remove result payload.
   */
  adminRemoveModePool: async (mode: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveModePool(mode), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Replace an entire mode pool and invalidate admin caches.
   * @param mode Mode name.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the replace result payload.
   */
  adminReplaceModePool: async (mode: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List story level pool questions with paging params (cached).
   * @param levelId Story level id.
   * @param params Query params (paging/search).
   * @returns Promise resolving to the questions list payload.
   */
  adminListStoryLevelPoolQuestions: async (levelId: string, params: QueryParams) =>
    cachedGet(endpoints.adminStoryLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * List all question ids assigned to a story level pool (cached).
   * @param levelId Story level id.
   * @returns Promise resolving to the id list payload.
   */
  adminStoryLevelPoolIds: async (levelId: string) =>
    cachedGet(endpoints.adminStoryLevelPoolIds(levelId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Remove questions from a story level pool and invalidate admin caches.
   * @param levelId Story level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the remove result payload.
   */
  adminRemoveStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveStoryLevelPool(levelId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Replace a story level pool and invalidate admin caches.
   * @param levelId Story level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the replace result payload.
   */
  adminReplaceStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List classic categories (cached).
   * @returns Promise resolving to the classic categories payload.
   */
  adminListClassicCategories: async () =>
    cachedGet(endpoints.adminClassicCategories(), {
      ttlMs: 20_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Create a classic category and invalidate admin caches.
   * @param body Category creation payload.
   * @returns Promise resolving to the created category payload.
   */
  adminCreateClassicCategory: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateClassicCategory(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Delete a classic category and invalidate admin caches.
   * @param categoryId Category id.
   * @returns Promise resolving to the delete result payload.
   */
  adminDeleteClassicCategory: async (categoryId: string) => {
    const data = (await http.delete(endpoints.adminDeleteClassicCategory(categoryId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List classic category pool questions with paging/filter params (cached).
   * @param categoryId Category id.
   * @param params Query params (paging/search).
   * @returns Promise resolving to the questions list payload.
   */
  adminListClassicCategoryPoolQuestions: async (categoryId: string, params: QueryParams) =>
    cachedGet(endpoints.adminClassicCategoryPoolQuestions(categoryId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * List all question ids assigned to a classic category pool (cached).
   * @param categoryId Category id.
   * @returns Promise resolving to the id list payload.
   */
  adminClassicCategoryPoolIds: async (categoryId: string) =>
    cachedGet(endpoints.adminClassicCategoryPoolIds(categoryId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Add questions to a classic category pool and invalidate admin caches.
   * @param categoryId Category id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the add result payload.
   */
  adminAddClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Remove questions from a classic category pool and invalidate admin caches.
   * @param categoryId Category id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the remove result payload.
   */
  adminRemoveClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveClassicCategoryPool(categoryId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Replace a classic category pool and invalidate admin caches.
   * @param categoryId Category id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the replace result payload.
   */
  adminReplaceClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Seed a classic category pool and invalidate admin caches.
   * @param categoryId Category id.
   * @param body Seed parameters payload.
   * @returns Promise resolving to the seed result payload.
   */
  adminSeedClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List classic category levels for a category (cached).
   * @param categoryId Category id.
   * @returns Promise resolving to the levels payload.
   */
  adminClassicCategoryLevels: async (categoryId: string) =>
    cachedGet(endpoints.adminClassicCategoryLevels(categoryId), {
      ttlMs: 20_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Create a classic category level and invalidate admin caches.
   * @param categoryId Category id.
   * @param body Level creation payload.
   * @returns Promise resolving to the created level payload.
   */
  adminCreateClassicCategoryLevel: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminCreateClassicCategoryLevel(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Delete a classic category level and invalidate admin caches.
   * @param levelId Level id.
   * @returns Promise resolving to the delete result payload.
   */
  adminDeleteClassicCategoryLevel: async (levelId: string) => {
    const data = (await http.delete(endpoints.adminDeleteClassicCategoryLevel(levelId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List classic level pool questions with paging/filter params (cached).
   * @param levelId Level id.
   * @param params Query params (paging/search).
   * @returns Promise resolving to the questions list payload.
   */
  adminListClassicLevelPoolQuestions: async (levelId: string, params: QueryParams) =>
    cachedGet(endpoints.adminClassicLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * List all question ids assigned to a classic level pool (cached).
   * @param levelId Level id.
   * @returns Promise resolving to the id list payload.
   */
  adminClassicLevelPoolIds: async (levelId: string) =>
    cachedGet(endpoints.adminClassicLevelPoolIds(levelId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Add questions to a classic level pool and invalidate admin caches.
   * @param levelId Level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the add result payload.
   */
  adminAddClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Remove questions from a classic level pool and invalidate admin caches.
   * @param levelId Level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the remove result payload.
   */
  adminRemoveClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveClassicLevelPool(levelId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Replace a classic level pool and invalidate admin caches.
   * @param levelId Level id.
   * @param body Payload containing question ids.
   * @returns Promise resolving to the replace result payload.
   */
  adminReplaceClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * Seed a classic level pool and invalidate admin caches.
   * @param levelId Level id.
   * @param body Seed parameters payload.
   * @returns Promise resolving to the seed result payload.
   */
  adminSeedClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },

  /**
   * List quiz reports for moderation (cached).
   * @param params Query params (status/paging).
   * @returns Promise resolving to the reports payload.
   */
  adminListQuizReports: async (params: QueryParams) =>
    cachedGet(endpoints.adminQuizReports(), {
      params,
      ttlMs: 5_000,
      scope: 'user',
      prefer: 'localStorage',
    }),

  /**
   * Resolve a quiz report and invalidate report caches.
   * @param reportId Report id.
   * @returns Promise resolving to the resolve result payload.
   */
  adminResolveQuizReport: async (reportId: string) => {
    const data = (await http.post(endpoints.adminResolveQuizReport(reportId), {})).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },

  /**
   * Delete a custom quiz as admin and invalidate relevant caches.
   * @param quizId Quiz id.
   * @returns Promise resolving to the delete result payload.
   */
  adminDeleteCustomQuiz: async (quizId: string) => {
    const data = (await http.delete(endpoints.adminDeleteCustomQuiz(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },

  /**
   * Ban a user and invalidate report caches.
   * @param userId Target user id.
   * @param body Ban payload (reason, etc.).
   * @returns Promise resolving to the ban result payload.
   */
  adminBanUser: async (userId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminBanUser(userId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
};
