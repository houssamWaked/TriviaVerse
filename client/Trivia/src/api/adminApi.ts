import { http } from './httpClient';
import { endpoints } from './endpoints';
import {
  cachedGet,
  invalidatePublicCacheByPathPrefix,
  invalidateUserCacheByPathPrefix,
} from './shared';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminApi = {
  adminListStoryLevels: async () =>
    cachedGet(endpoints.adminStoryLevels(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAllAssignedQuestionIds: async () =>
    cachedGet(endpoints.adminAllAssignedQuestionIds(), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminCreateStoryLevel: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateStoryLevel(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },
  adminDeleteStoryLevel: async (levelId: string) => {
    const data = (await http.delete(endpoints.adminDeleteStoryLevel(levelId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/story/levels');
    return data;
  },
  adminAddStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminSeedStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminCreateGlobalQuestion: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateGlobalQuestion(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminListGlobalQuestions: async (params: QueryParams) =>
    cachedGet(endpoints.adminListGlobalQuestions(), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminGetGlobalQuestion: async (questionId: string) =>
    (await http.get(endpoints.adminGlobalQuestionById(questionId))).data,
  adminPatchGlobalQuestion: async (questionId: string, body: unknown) => {
    const data = (await http.patch(endpoints.adminGlobalQuestionById(questionId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminReplaceGlobalQuestionOptions: async (questionId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceGlobalQuestionOptions(questionId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminDeleteGlobalQuestion: async (questionId: string) => {
    const data = (await http.delete(endpoints.adminDeleteGlobalQuestion(questionId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminModePoolSummary: async (mode: string) =>
    cachedGet(endpoints.adminModePoolSummary(mode), {
      ttlMs: 10_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminModePoolIds: async (mode: string) =>
    cachedGet(endpoints.adminModePoolIds(mode), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminSeedModePool: async (mode: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListModePoolQuestions: async (mode: string, params: QueryParams) =>
    cachedGet(endpoints.adminModePoolQuestions(mode), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAddModePool: async (mode: string, body: unknown) => {
    const data = (await http.post(endpoints.adminModePoolSummary(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminRemoveModePool: async (mode: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveModePool(mode), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceModePool: async (mode: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceModePool(mode), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListStoryLevelPoolQuestions: async (levelId: string, params: QueryParams) =>
    cachedGet(endpoints.adminStoryLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminStoryLevelPoolIds: async (levelId: string) =>
    cachedGet(endpoints.adminStoryLevelPoolIds(levelId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminRemoveStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveStoryLevelPool(levelId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceStoryLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceStoryLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListClassicCategories: async () =>
    cachedGet(endpoints.adminClassicCategories(), {
      ttlMs: 20_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminCreateClassicCategory: async (body: unknown) => {
    const data = (await http.post(endpoints.adminCreateClassicCategory(), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminDeleteClassicCategory: async (categoryId: string) => {
    const data = (await http.delete(endpoints.adminDeleteClassicCategory(categoryId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListClassicCategoryPoolQuestions: async (categoryId: string, params: QueryParams) =>
    cachedGet(endpoints.adminClassicCategoryPoolQuestions(categoryId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminClassicCategoryPoolIds: async (categoryId: string) =>
    cachedGet(endpoints.adminClassicCategoryPoolIds(categoryId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAddClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminRemoveClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveClassicCategoryPool(categoryId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminSeedClassicCategoryPool: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedClassicCategoryPool(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminClassicCategoryLevels: async (categoryId: string) =>
    cachedGet(endpoints.adminClassicCategoryLevels(categoryId), {
      ttlMs: 20_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminCreateClassicCategoryLevel: async (categoryId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminCreateClassicCategoryLevel(categoryId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminDeleteClassicCategoryLevel: async (levelId: string) => {
    const data = (await http.delete(endpoints.adminDeleteClassicCategoryLevel(levelId))).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListClassicLevelPoolQuestions: async (levelId: string, params: QueryParams) =>
    cachedGet(endpoints.adminClassicLevelPoolQuestions(levelId), {
      params,
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminClassicLevelPoolIds: async (levelId: string) =>
    cachedGet(endpoints.adminClassicLevelPoolIds(levelId), {
      ttlMs: 15_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminAddClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminAddClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminRemoveClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.delete(endpoints.adminRemoveClassicLevelPool(levelId), { data: body })).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminReplaceClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.put(endpoints.adminReplaceClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminSeedClassicLevelPool: async (levelId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminSeedClassicLevelPool(levelId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin');
    return data;
  },
  adminListQuizReports: async (params: QueryParams) =>
    cachedGet(endpoints.adminQuizReports(), {
      params,
      ttlMs: 5_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  adminResolveQuizReport: async (reportId: string) => {
    const data = (await http.post(endpoints.adminResolveQuizReport(reportId), {})).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
  adminDeleteCustomQuiz: async (quizId: string) => {
    const data = (await http.delete(endpoints.adminDeleteCustomQuiz(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  adminBanUser: async (userId: string, body: unknown) => {
    const data = (await http.post(endpoints.adminBanUser(userId), body)).data;
    invalidateUserCacheByPathPrefix('/api/admin/reports');
    return data;
  },
};
