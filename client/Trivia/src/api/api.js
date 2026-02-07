/**
 * Typed-ish API calls (one function per backend route).
 *
 * Conventions:
 * - Functions return `data` (Axios response body)
 * - Auth-required endpoints rely on the token set via `setAuthToken()`
 */
import { http } from './httpClient';
import { endpoints } from './endpoints';

export const api = {
  // public
  getHomeMetrics: async () => (await http.get(endpoints.homeMetrics())).data,
  getTopQuizzes: async (limit = 20) =>
    (
      await http.get(endpoints.publicQuizTop(), {
        params: { limit },
      })
    ).data,
  searchQuizzes: async (q, limit = 30) =>
    (
      await http.get(endpoints.publicQuizSearch(), {
        params: { q, limit },
      })
    ).data,
  getPublicQuiz: async (quizId) =>
    (await http.get(endpoints.publicQuizById(quizId))).data,
  getPublicQuizRatings: async (quizId) =>
    (await http.get(endpoints.publicQuizRatings(quizId))).data,
  getPublicQuizLeaderboard: async (quizId, limit = 20) =>
    (
      await http.get(endpoints.publicQuizLeaderboard(quizId), {
        params: { limit },
      })
    ).data,

  // auth
  register: async (body) => (await http.post(endpoints.register(), body)).data,
  login: async (body) => (await http.post(endpoints.login(), body)).data,

  // leaderboard
  getLeaderboard: async (params) =>
    (await http.get(endpoints.leaderboard(), { params })).data,

  // categories
  listCategories: async () => (await http.get(endpoints.categories())).data,
  searchCategories: async (q) =>
    (await http.get(endpoints.categorySearch(), { params: { q } })).data,
  getCategory: async (id) => (await http.get(endpoints.categoryById(id))).data,
  getCategoryStats: async (id) =>
    (await http.get(endpoints.categoryStats(id))).data,
  createCategory: async (body) =>
    (await http.post(endpoints.categories(), body)).data,
  updateCategory: async (id, body) =>
    (await http.put(endpoints.categoryById(id), body)).data,
  deleteCategory: async (id) =>
    (await http.delete(endpoints.categoryById(id))).data,

  // story
  getStoryLevels: async () => (await http.get(endpoints.storyLevels())).data,
  getStoryProgress: async () => (await http.get(endpoints.storyProgress())).data,
  startStorySession: async (body) =>
    (await http.post(endpoints.storyStart(), body)).data,

  // millionaire
  getMillionaireConfig: async () =>
    (await http.get(endpoints.millionaireConfig())).data,
  startMillionaireSession: async (body) =>
    (await http.post(endpoints.millionaireStart(), body)).data,

  // classic
  startClassicSession: async (body) =>
    (await http.post(endpoints.classicStart(), body)).data,

  // blitz
  getBlitzConfig: async () => (await http.get(endpoints.blitzConfig())).data,
  startBlitzSession: async (body) =>
    (await http.post(endpoints.blitzStart(), body)).data,

  // sessions
  getCurrentQuestion: async (sessionId) =>
    (await http.get(endpoints.sessionCurrent(sessionId))).data,
  submitAnswer: async (sessionId, body) =>
    (await http.post(endpoints.sessionAnswer(sessionId), body)).data,
  useLifeline: async (sessionId, body) =>
    (await http.post(endpoints.sessionUseLifeline(sessionId), body)).data,
  finishSession: async (sessionId, body) =>
    (await http.post(endpoints.sessionFinish(sessionId), body)).data,

  // quiz builder
  listMyQuizzes: async () => (await http.get(endpoints.quizzes())).data,
  listMyPlayedQuizzes: async () => (await http.get(endpoints.myPlayedQuizzes())).data,
  createQuiz: async (body) => (await http.post(endpoints.quizzes(), body)).data,
  getQuiz: async (quizId) => (await http.get(endpoints.quizById(quizId))).data,
  patchQuiz: async (quizId, body) =>
    (await http.patch(endpoints.quizById(quizId), body)).data,
  publishQuiz: async (quizId) =>
    (await http.post(endpoints.quizPublish(quizId), {})).data,
  shareQuiz: async (quizId, body) =>
    (await http.post(endpoints.quizShare(quizId), body)).data,
  rateQuiz: async (quizId, body) =>
    (await http.post(endpoints.quizRatings(quizId), body)).data,
  listQuizAccess: async (quizId) =>
    (await http.get(endpoints.quizAccess(quizId))).data,
  addQuizAccess: async (quizId, body) =>
    (await http.post(endpoints.quizAccess(quizId), body)).data,
  removeQuizAccess: async (quizId, userId) =>
    (await http.delete(endpoints.quizAccessUser(quizId, userId))).data,
  startCustomQuizSession: async (quizId) =>
    (await http.post(endpoints.customQuizStart(quizId), {})).data,

  listQuizQuestions: async (quizId) =>
    (await http.get(endpoints.quizQuestions(quizId))).data,
  addQuizQuestion: async (quizId, body) =>
    (await http.post(endpoints.quizQuestions(quizId), body)).data,

  patchQuestion: async (questionId, body) =>
    (await http.patch(endpoints.questionById(questionId), body)).data,
  deleteQuestion: async (questionId) =>
    (await http.delete(endpoints.questionById(questionId))).data,

  addOption: async (questionId, body) =>
    (await http.post(endpoints.questionOptions(questionId), body)).data,
  patchOption: async (optionId, body) =>
    (await http.patch(endpoints.optionById(optionId), body)).data,
  deleteOption: async (optionId) =>
    (await http.delete(endpoints.optionById(optionId))).data,

  // friends
  listFriends: async () => (await http.get(endpoints.friends())).data,
  listFriendRequests: async () => (await http.get(endpoints.friendRequests())).data,
  sendFriendRequest: async (body) =>
    (await http.post(endpoints.friendRequests(), body)).data,
  acceptFriendRequest: async (requestId) =>
    (await http.post(endpoints.friendRequestAccept(requestId), {})).data,
  declineFriendRequest: async (requestId) =>
    (await http.post(endpoints.friendRequestDecline(requestId), {})).data,
  cancelFriendRequest: async (requestId) =>
    (await http.delete(endpoints.friendRequestCancel(requestId))).data,
  getFriendStats: async (friendUserId) =>
    (await http.get(endpoints.friendStats(friendUserId))).data,

  // quiz delete
  deleteQuiz: async (quizId) => (await http.delete(endpoints.quizById(quizId))).data,

  // admin
  adminListStoryLevels: async () => (await http.get(endpoints.adminStoryLevels())).data,
  adminCreateStoryLevel: async (body) =>
    (await http.post(endpoints.adminCreateStoryLevel(), body)).data,
  adminAddStoryLevelPool: async (levelId, body) =>
    (await http.post(endpoints.adminAddStoryLevelPool(levelId), body)).data,
  adminSeedStoryLevelPool: async (levelId, body) =>
    (await http.post(endpoints.adminSeedStoryLevelPool(levelId), body)).data,
  adminCreateGlobalQuestion: async (body) =>
    (await http.post(endpoints.adminCreateGlobalQuestion(), body)).data,
  adminListGlobalQuestions: async (params) =>
    (await http.get(endpoints.adminListGlobalQuestions(), { params })).data,
  adminSearchGlobalQuestions: async (q, limit = 20) =>
    (
      await http.get(endpoints.adminSearchGlobalQuestions(), {
        params: { q, limit },
      })
    ).data,
  adminModePoolSummary: async (mode) =>
    (await http.get(endpoints.adminModePoolSummary(mode))).data,
  adminSeedModePool: async (mode, body) =>
    (await http.post(endpoints.adminSeedModePool(mode), body)).data,
  adminListModePoolQuestions: async (mode, params) =>
    (await http.get(endpoints.adminModePoolQuestions(mode), { params })).data,
  adminAddModePool: async (mode, body) =>
    (await http.post(endpoints.adminModePoolSummary(mode), body)).data,
  adminRemoveModePool: async (mode, body) =>
    (await http.delete(endpoints.adminRemoveModePool(mode), { data: body })).data,
  adminReplaceModePool: async (mode, body) =>
    (await http.put(endpoints.adminReplaceModePool(mode), body)).data,
  adminListStoryLevelPoolQuestions: async (levelId, params) =>
    (await http.get(endpoints.adminStoryLevelPoolQuestions(levelId), { params })).data,
  adminRemoveStoryLevelPool: async (levelId, body) =>
    (await http.delete(endpoints.adminRemoveStoryLevelPool(levelId), { data: body })).data,
  adminReplaceStoryLevelPool: async (levelId, body) =>
    (await http.put(endpoints.adminReplaceStoryLevelPool(levelId), body)).data,

  // classic categories
  adminListClassicCategories: async () =>
    (await http.get(endpoints.adminClassicCategories())).data,
  adminCreateClassicCategory: async (body) =>
    (await http.post(endpoints.adminCreateClassicCategory(), body)).data,
  adminDeleteClassicCategory: async (categoryId) =>
    (await http.delete(endpoints.adminDeleteClassicCategory(categoryId))).data,
  adminListClassicCategoryPoolQuestions: async (categoryId, params) =>
    (await http.get(endpoints.adminClassicCategoryPoolQuestions(categoryId), { params })).data,
  adminAddClassicCategoryPool: async (categoryId, body) =>
    (await http.post(endpoints.adminAddClassicCategoryPool(categoryId), body)).data,
  adminRemoveClassicCategoryPool: async (categoryId, body) =>
    (await http.delete(endpoints.adminRemoveClassicCategoryPool(categoryId), { data: body })).data,
  adminReplaceClassicCategoryPool: async (categoryId, body) =>
    (await http.put(endpoints.adminReplaceClassicCategoryPool(categoryId), body)).data,
  adminSeedClassicCategoryPool: async (categoryId, body) =>
    (await http.post(endpoints.adminSeedClassicCategoryPool(categoryId), body)).data,
};
