/**
 * API endpoint helpers (paths only).
 *
 * Keep this file "dumb": no HTTP calls here—just route builders.
 */

export const endpoints = {
  // public
  homeMetrics: () => '/api/public/home-metrics',
  publicQuizSearch: () => '/api/public/quizzes/search',
  publicQuizById: (quizId) => `/api/public/quizzes/${quizId}`,
  publicQuizRatings: (quizId) => `/api/public/quizzes/${quizId}/ratings`,
  publicQuizLeaderboard: (quizId) => `/api/public/quizzes/${quizId}/leaderboard`,
  publicQuizTop: () => '/api/public/quizzes/top',

  // auth
  register: () => '/api/auth/register',
  login: () => '/api/auth/login',

  // leaderboard
  leaderboard: () => '/api/leaderboard',

  // categories
  categories: () => '/api/categories',
  categoryById: (id) => `/api/categories/${id}`,
  categorySearch: () => '/api/categories/search',
  categoryStats: (id) => `/api/categories/${id}/stats`,

  // story
  storyLevels: () => '/api/story/levels',
  storyProgress: () => '/api/story/progress',
  storyStart: () => '/api/story/sessions/start',

  // millionaire
  millionaireConfig: () => '/api/millionaire/config',
  millionaireStart: () => '/api/millionaire/sessions/start',

  // classic
  classicStart: () => '/api/classic/sessions/start',

  // blitz
  blitzConfig: () => '/api/blitz/config',
  blitzStart: () => '/api/blitz/sessions/start',

  // sessions gameplay
  sessionCurrent: (sessionId) => `/api/sessions/${sessionId}/current`,
  sessionAnswer: (sessionId) => `/api/sessions/${sessionId}/answer`,
  sessionUseLifeline: (sessionId) => `/api/sessions/${sessionId}/lifelines/use`,
  sessionFinish: (sessionId) => `/api/sessions/${sessionId}/finish`,

  // quiz builder
  quizzes: () => '/api/quizzes',
  myPlayedQuizzes: () => '/api/quizzes/played',
  quizById: (quizId) => `/api/quizzes/${quizId}`,
  quizQuestions: (quizId) => `/api/quizzes/${quizId}/questions`,
  quizPublish: (quizId) => `/api/quizzes/${quizId}/publish`,
  quizShare: (quizId) => `/api/quizzes/${quizId}/share`,
  quizRatings: (quizId) => `/api/quizzes/${quizId}/ratings`,
  quizAccess: (quizId) => `/api/quizzes/${quizId}/access`,
  quizAccessUser: (quizId, userId) => `/api/quizzes/${quizId}/access/${userId}`,
  customQuizStart: (quizId) => `/api/quizzes/${quizId}/sessions/start`,
  questionById: (questionId) => `/api/questions/${questionId}`,
  questionOptions: (questionId) => `/api/questions/${questionId}/options`,
  optionById: (optionId) => `/api/options/${optionId}`,

  // friends
  friends: () => '/api/friends',
  friendRequests: () => '/api/friends/requests',
  friendRequestAccept: (requestId) => `/api/friends/requests/${requestId}/accept`,
  friendRequestDecline: (requestId) => `/api/friends/requests/${requestId}/decline`,
  friendRequestCancel: (requestId) => `/api/friends/requests/${requestId}`,
  friendStats: (friendUserId) => `/api/friends/${friendUserId}/stats`,

  // admin
  adminStoryLevels: () => '/api/admin/story/levels',
  adminCreateStoryLevel: () => '/api/admin/story/levels',
  adminAddStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,
  adminSeedStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool/seed`,
  adminCreateGlobalQuestion: () => '/api/admin/questions',
  adminListGlobalQuestions: () => '/api/admin/questions',
  adminSearchGlobalQuestions: () => '/api/admin/questions/search',
  adminModePoolSummary: (mode) => `/api/admin/modes/${mode}/pool`,
  adminSeedModePool: (mode) => `/api/admin/modes/${mode}/pool/seed`,
  adminModePoolQuestions: (mode) => `/api/admin/modes/${mode}/pool/questions`,
  adminRemoveModePool: (mode) => `/api/admin/modes/${mode}/pool`,
  adminReplaceModePool: (mode) => `/api/admin/modes/${mode}/pool`,
  adminStoryLevelPoolQuestions: (levelId) => `/api/admin/story/levels/${levelId}/pool/questions`,
  adminRemoveStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,
  adminReplaceStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,

  // classic category pools (classic mode only)
  adminClassicCategories: () => '/api/admin/classic/categories',
  adminCreateClassicCategory: () => '/api/admin/classic/categories',
  adminDeleteClassicCategory: (categoryId) => `/api/admin/classic/categories/${categoryId}`,
  adminClassicCategoryPoolQuestions: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool/questions`,
  adminAddClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminRemoveClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminReplaceClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminSeedClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool/seed`,
};
