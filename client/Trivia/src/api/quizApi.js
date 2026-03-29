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

export const quizApi = {
  listMyQuizzes: async () =>
    cachedGet(endpoints.quizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  listMyPlayedQuizzes: async () =>
    cachedGet(endpoints.myPlayedQuizzes(), { ttlMs: 2 * 60_000, scope: 'user', prefer: 'localStorage' }),
  createQuiz: async (body) => {
    const data = (await http.post(endpoints.quizzes(), body)).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
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
    indexQuizQuestionId(data?.id, quizId);
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
  addOption: async (questionId, body) => {
    const data = (await http.post(endpoints.questionOptions(questionId), body)).data;
    const quizId = getQuizIdForQuestionId(questionId);
    if (quizId) indexQuizOptionId(data?.id, quizId);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    return data;
  },
  patchOption: async (optionId, body) => {
    const data = (await http.patch(endpoints.optionById(optionId), body)).data;
    const quizId = getQuizIdForOptionId(optionId) || getQuizIdForQuestionId(data?.question_id);
    if (quizId) invalidateUserCacheByPathPrefix(`/api/quizzes/${quizId}/questions`);
    if (quizId) indexQuizOptionId(data?.id, quizId);
    return data;
  },
  deleteQuiz: async (quizId) => {
    const data = (await http.delete(endpoints.quizById(quizId))).data;
    invalidateUserCacheByPathPrefix('/api/quizzes');
    invalidatePublicCacheByPathPrefix(`/api/public/quizzes/${quizId}`);
    invalidatePublicCacheByPathPrefix('/api/public/quizzes/top');
    invalidatePublicCacheByPathPrefix('/api/public/home-metrics');
    return data;
  },
};
