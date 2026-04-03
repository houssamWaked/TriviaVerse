import { http } from './httpClient';
import { endpoints } from './endpoints';
import {
  cachedGet,
  invalidatePublicCacheByPathPrefix,
  invalidateUserCacheByPathPrefix,
} from './shared';

type FinishedSessionResponse = {
  status?: string;
  session?: {
    mode?: string;
    quiz_id?: string;
  };
  classic?: {
    category_id?: string;
  };
};

export const gameplayApi = {
  getStoryLevels: async () =>
    cachedGet(endpoints.storyLevels(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  getStoryProgress: async () =>
    cachedGet(endpoints.storyProgress(), {
      ttlMs: 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  startStorySession: async (body: unknown) => (await http.post(endpoints.storyStart(), body)).data,
  getMillionaireConfig: async () =>
    cachedGet(endpoints.millionaireConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  startMillionaireSession: async (body: unknown) =>
    (await http.post(endpoints.millionaireStart(), body)).data,
  startClassicSession: async (body: unknown) =>
    (await http.post(endpoints.classicStart(), body)).data,
  getClassicCategoryLevels: async (categoryId: string) =>
    cachedGet(endpoints.classicCategoryLevels(categoryId), {
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  getClassicCategoryProgress: async (categoryId: string) =>
    cachedGet(endpoints.classicCategoryProgress(categoryId), {
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  getBlitzConfig: async () =>
    cachedGet(endpoints.blitzConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  startBlitzSession: async (body: unknown) => (await http.post(endpoints.blitzStart(), body)).data,
  getCurrentQuestion: async (sessionId: string) =>
    (await http.get(endpoints.sessionCurrent(sessionId))).data,
  getSessionReview: async (sessionId: string) =>
    (await http.get(endpoints.sessionReview(sessionId))).data,
  submitAnswer: async (sessionId: string, body: unknown) =>
    (await http.post(endpoints.sessionAnswer(sessionId), body)).data,
  useLifeline: async (sessionId: string, body: unknown) =>
    (await http.post(endpoints.sessionUseLifeline(sessionId), body)).data,
  finishSession: async (sessionId: string, body: unknown) => {
    const data = (await http.post(endpoints.sessionFinish(sessionId), body)).data as FinishedSessionResponse;

    if (data?.status === 'completed' && data?.session?.mode === 'custom' && data?.session?.quiz_id) {
      invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${data.session.quiz_id}/leaderboard`);
    }

    if (data?.status === 'completed' && data?.session?.mode === 'story') {
      invalidateUserCacheByPathPrefix('/api/story/progress');
      invalidateUserCacheByPathPrefix('/api/me');
    }
    if (data?.status === 'completed' && data?.session?.mode === 'classic') {
      const categoryId = String(data?.classic?.category_id || '').trim();
      if (categoryId) {
        invalidateUserCacheByPathPrefix(`/api/classic/categories/${categoryId}/progress`);
      }
      invalidateUserCacheByPathPrefix('/api/me');
    }

    return data;
  },
};
