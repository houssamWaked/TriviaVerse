import { http } from './httpClient';
import { endpoints } from './endpoints';
import {
  cachedGet,
  getQuizIdForOptionId,
  getQuizIdForQuestionId,
  indexQuizOptionId,
  indexQuizQuestionId,
  indexQuizQuestionsForQuiz,
  invalidatePublicCacheByPathPrefix,
  invalidateUserCacheByPathPrefix,
} from './shared';

type QuizQuestionList = Array<{
  id?: string | number | null;
  options?: Array<{ id?: string | number | null } | null> | null;
}>;

type QuizQuestionMutationResponse = {
  id?: string | number | null;
  quiz_id?: string | number | null;
  question_id?: string | number | null;
};

/**
 * Quiz builder API wrapper for calling `/api/quizzes/*` and related endpoints.
 *
 * This module also maintains a small in-memory index of question/option ids to `quiz_id`
 * to make cache invalidation robust across mutation responses.
 */
export const quizApi = {
  /**
   * List quizzes owned by the current user (cached).
   * @returns Promise resolving to quiz list payload.
   */
  listMyQuizzes: async () =>
    cachedGet(endpoints.quizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  /**
   * List quizzes the current user has played (cached).
   * @returns Promise resolving to played quiz entries payload.
   */
  listMyPlayedQuizzes: async () =>
    cachedGet(endpoints.myPlayedQuizzes(), {
      ttlMs: 2 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Create a new quiz and invalidate relevant caches.
   * @param body Quiz creation payload.
   * @returns Promise resolving to the created quiz payload.
   */
  createQuiz: async (body: unknown) => {
    const data = (await http.post(endpoints.quizzes(), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  /**
   * Fetch a quiz owned by the current user (cached).
   * @param quizId Quiz id.
   * @returns Promise resolving to quiz payload.
   */
  getQuiz: async (quizId: string) =>
    cachedGet(endpoints.quizById(quizId), {
      ttlMs: 2 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Patch quiz metadata and invalidate user quiz caches.
   * @param quizId Quiz id.
   * @param body Patch payload.
   * @returns Promise resolving to updated quiz payload.
   */
  patchQuiz: async (quizId: string, body: unknown) => {
    const data = (await http.patch(endpoints.quizById(quizId), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    return data;
  },
  /**
   * Publish a quiz and invalidate both user and public discovery caches.
   * @param quizId Quiz id.
   * @returns Promise resolving to publish result payload.
   */
  publishQuiz: async (quizId: string) => {
    const data = (await http.post(endpoints.quizPublish(quizId), {})).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    return data;
  },
  /**
   * Rate a quiz and invalidate public rating/leaderboard/top caches.
   * @param quizId Quiz id.
   * @param body Rating payload.
   * @returns Promise resolving to rating summary payload.
   */
  rateQuiz: async (quizId: string, body: unknown) => {
    const data = (await http.post(endpoints.quizRatings(quizId), body)).data;
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/ratings`);
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}/leaderboard`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  /**
   * Report a quiz for moderation.
   * @param quizId Quiz id.
   * @param body Report payload.
   * @returns Promise resolving to report result payload.
   */
  reportQuiz: async (quizId: string, body: unknown) =>
    (await http.post(endpoints.quizReport(quizId), body)).data,
  /**
   * List explicit access entries for a quiz (cached).
   * @param quizId Quiz id.
   * @returns Promise resolving to access list payload.
   */
  listQuizAccess: async (quizId: string) =>
    cachedGet(endpoints.quizAccess(quizId), {
      ttlMs: 2 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }),
  /**
   * Add a user to a quiz access allow-list and invalidate access caches.
   * @param quizId Quiz id.
   * @param body Access payload.
   * @returns Promise resolving to add result payload.
   */
  addQuizAccess: async (quizId: string, body: unknown) => {
    const data = (await http.post(endpoints.quizAccess(quizId), body)).data;
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/access`);
    return data;
  },
  /**
   * Remove a user from a quiz access allow-list and invalidate access caches.
   * @param quizId Quiz id.
   * @param userId Target user id.
   * @returns Promise resolving to remove result payload.
   */
  removeQuizAccess: async (quizId: string, userId: string) => {
    const data = (await http.delete(endpoints.quizAccessUser(quizId, userId))).data;
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/access`);
    return data;
  },
  /**
   * Start a custom quiz gameplay session.
   * @param quizId Quiz id.
   * @returns Promise resolving to session start payload.
   */
  startCustomQuizSession: async (quizId: string) =>
    (await http.post(endpoints.customQuizStart(quizId), {})).data,
  /**
   * List quiz questions (cached) and index ids for later cache invalidation.
   * @param quizId Quiz id.
   * @returns Promise resolving to question list.
   */
  listQuizQuestions: async (quizId: string) =>
    cachedGet<QuizQuestionList>(endpoints.quizQuestions(quizId), {
      ttlMs: 2 * 60_000,
      scope: 'user',
      prefer: 'localStorage',
    }).then((data) => {
      indexQuizQuestionsForQuiz(quizId, data);
      return data;
    }),
  /**
   * Add a question to a quiz and invalidate question caches.
   * @param quizId Quiz id.
   * @param body Question payload.
   * @returns Promise resolving to created question payload.
   */
  addQuizQuestion: async (quizId: string, body: unknown) => {
    const data = (await http.post(endpoints.quizQuestions(quizId), body)).data as QuizQuestionMutationResponse;
    indexQuizQuestionId(data?.id, quizId);
    invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
  /**
   * Patch a quiz question and invalidate the owning quiz's question cache when known.
   * @param questionId Question id.
   * @param body Patch payload.
   * @returns Promise resolving to updated question payload.
   */
  patchQuestion: async (questionId: string, body: unknown) => {
    const data = (await http.patch(endpoints.questionById(questionId), body)).data as QuizQuestionMutationResponse;
    const quizId = data?.quiz_id || getQuizIdForQuestionId(questionId);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    return data;
  },
  /**
   * Add an option to a question and invalidate the owning quiz's question cache when known.
   * @param questionId Question id.
   * @param body Option payload.
   * @returns Promise resolving to created option payload.
   */
  addOption: async (questionId: string, body: unknown) => {
    const data = (await http.post(endpoints.questionOptions(questionId), body)).data as QuizQuestionMutationResponse;
    const quizId = getQuizIdForQuestionId(questionId);
    if (quizId) indexQuizOptionId(data?.id, quizId);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    return data;
  },
  /**
   * Patch an option and invalidate the owning quiz's question cache when known.
   * @param optionId Option id.
   * @param body Patch payload.
   * @returns Promise resolving to updated option payload.
   */
  patchOption: async (optionId: string, body: unknown) => {
    const data = (await http.patch(endpoints.optionById(optionId), body)).data as QuizQuestionMutationResponse;
    const quizId = getQuizIdForOptionId(optionId) || getQuizIdForQuestionId(data?.question_id);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    if (quizId) indexQuizOptionId(data?.id, quizId);
    return data;
  },
  /**
   * Delete a quiz and invalidate relevant user/public caches.
   * @param quizId Quiz id.
   * @returns Promise resolving to delete result payload.
   */
  deleteQuiz: async (quizId: string) => {
    const data = (await http.delete(endpoints.quizById(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
};
