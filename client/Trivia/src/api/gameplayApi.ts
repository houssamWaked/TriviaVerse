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

/**
 * Gameplay API wrapper for starting sessions and progressing through questions.
 */
export const gameplayApi = {
  /**
   * Get story level definitions (cached).
   * @returns Promise resolving to story levels payload.
   */
  getStoryLevels: async () =>
    cachedGet(endpoints.storyLevels(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Get the current user's story progress (cached).
   * @returns Promise resolving to progress payload.
   */
  getStoryProgress: async () =>
    cachedGet(endpoints.storyProgress(), {
      ttlMs: 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Start a story session.
   * @param body Session start payload.
   * @returns Promise resolving to session start payload.
   */
  startStorySession: async (body: unknown) => (await http.post(endpoints.storyStart(), body)).data,
  /**
   * Get millionaire ladder/config (cached).
   * @returns Promise resolving to config payload.
   */
  getMillionaireConfig: async () =>
    cachedGet(endpoints.millionaireConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Start a millionaire session.
   * @param body Session start payload.
   * @returns Promise resolving to session start payload.
   */
  startMillionaireSession: async (body: unknown) =>
    (await http.post(endpoints.millionaireStart(), body)).data,
  /**
   * Start a classic session.
   * @param body Session start payload.
   * @returns Promise resolving to session start payload.
   */
  startClassicSession: async (body: unknown) =>
    (await http.post(endpoints.classicStart(), body)).data,
  /**
   * Get classic levels for a category (cached).
   * @param categoryId Category id.
   * @returns Promise resolving to levels payload.
   */
  getClassicCategoryLevels: async (categoryId: string) =>
    cachedGet(endpoints.classicCategoryLevels(categoryId), {
      ttlMs: 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Get the current user's progress for a classic category (cached).
   * @param categoryId Category id.
   * @returns Promise resolving to progress payload.
   */
  getClassicCategoryProgress: async (categoryId: string) =>
    cachedGet(endpoints.classicCategoryProgress(categoryId), {
      ttlMs: 30_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Get blitz mode config (cached).
   * @returns Promise resolving to blitz config payload.
   */
  getBlitzConfig: async () =>
    cachedGet(endpoints.blitzConfig(), {
      ttlMs: 24 * 60 * 60_000,
      scope: 'public',
      prefer: 'localStorage',
      cache: 'essential',
    }),
  /**
   * Start a blitz session.
   * @param body Session start payload.
   * @returns Promise resolving to session start payload.
   */
  startBlitzSession: async (body: unknown) => (await http.post(endpoints.blitzStart(), body)).data,
  /**
   * Get the current question payload for a session.
   * @param sessionId Session id.
   * @returns Promise resolving to current question payload.
   */
  getCurrentQuestion: async (sessionId: string) =>
    (await http.get(endpoints.sessionCurrent(sessionId))).data,
  /**
   * Get the completed session review payload.
   * @param sessionId Session id.
   * @returns Promise resolving to review payload.
   */
  getSessionReview: async (sessionId: string) =>
    (await http.get(endpoints.sessionReview(sessionId))).data,
  /**
   * Submit an answer for the current question.
   * @param sessionId Session id.
   * @param body Answer payload.
   * @returns Promise resolving to answer result payload.
   */
  submitAnswer: async (sessionId: string, body: unknown) =>
    (await http.post(endpoints.sessionAnswer(sessionId), body)).data,
  /**
   * Use a lifeline for the current session question.
   * @param sessionId Session id.
   * @param body Lifeline payload.
   * @returns Promise resolving to lifeline result payload.
   */
  useLifeline: async (sessionId: string, body: unknown) =>
    (await http.post(endpoints.sessionUseLifeline(sessionId), body)).data,
  /**
   * Finish a session and invalidate caches impacted by completion.
   * @param sessionId Session id.
   * @param body Finish payload (status, etc.).
   * @returns Promise resolving to finish payload.
   */
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
