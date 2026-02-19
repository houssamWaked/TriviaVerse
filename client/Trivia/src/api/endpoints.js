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

  // public gameplay/modes
  storyLevels: () => '/api/public/story/levels',
  storyStart: () => '/api/public/story/sessions/start',
  millionaireConfig: () => '/api/public/millionaire/config',
  millionaireStart: () => '/api/public/millionaire/sessions/start',
  classicStart: () => '/api/public/classic/sessions/start',
  classicCategoryLevels: (categoryId) => `/api/public/classic/categories/${categoryId}/levels`,
  blitzConfig: () => '/api/public/blitz/config?v=2',
  blitzStart: () => '/api/public/blitz/sessions/start',
  sessionCurrent: (sessionId) => `/api/public/sessions/${sessionId}/current`,
  sessionReview: (sessionId) => `/api/public/sessions/${sessionId}/review`,
  sessionAnswer: (sessionId) => `/api/public/sessions/${sessionId}/answer`,
  sessionUseLifeline: (sessionId) => `/api/public/sessions/${sessionId}/lifelines/use`,
  sessionFinish: (sessionId) => `/api/public/sessions/${sessionId}/finish`,
  leaderboard: () => '/api/public/leaderboard',

  // public categories (read-only)
  publicCategories: () => '/api/public/categories',
  publicCategoryStats: (id) => `/api/public/categories/${id}/stats`,

  // auth
  register: () => '/api/auth/register',
  login: () => '/api/auth/login',
  refresh: () => '/api/auth/refresh',
  logout: () => '/api/auth/logout',
  verifyEmail: () => '/api/auth/verify-email',
  resendVerification: () => '/api/auth/resend-verification',
  googleAuth: () => '/api/auth/google',

  // story (protected)
  storyProgress: () => '/api/story/progress',

  // classic (protected)
  classicCategoryProgress: (categoryId) => `/api/classic/categories/${categoryId}/progress`,

  // quiz builder
  quizzes: () => '/api/quizzes',
  myPlayedQuizzes: () => '/api/quizzes/played',
  quizById: (quizId) => `/api/quizzes/${quizId}`,
  quizQuestions: (quizId) => `/api/quizzes/${quizId}/questions`,
  quizPublish: (quizId) => `/api/quizzes/${quizId}/publish`,
  quizRatings: (quizId) => `/api/quizzes/${quizId}/ratings`,
  quizReport: (quizId) => `/api/quizzes/${quizId}/report`,
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
  friendProfile: (friendUserId) => `/api/friends/${friendUserId}/profile`,

  // me
  meProfile: () => '/api/me/profile',

  // duels
  duels: () => '/api/duels',
  duelAccept: (duelId) => `/api/duels/${duelId}/accept`,
  duelDecline: (duelId) => `/api/duels/${duelId}/decline`,
  duelCancel: (duelId) => `/api/duels/${duelId}/cancel`,
  duelState: (duelId) => `/api/duels/${duelId}/state`,
  duelAnswer: (duelId) => `/api/duels/${duelId}/answer`,

  // admin
  adminStoryLevels: () => '/api/admin/story/levels',
  adminAllAssignedQuestionIds: () => '/api/admin/pools/assigned',
  adminCreateStoryLevel: () => '/api/admin/story/levels',
  adminDeleteStoryLevel: (levelId) => `/api/admin/story/levels/${levelId}`,
  adminAddStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,
  adminSeedStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool/seed`,
  adminCreateGlobalQuestion: () => '/api/admin/questions',
  adminListGlobalQuestions: () => '/api/admin/questions',
  adminGlobalQuestionById: (questionId) => `/api/admin/questions/${questionId}`,
  adminReplaceGlobalQuestionOptions: (questionId) => `/api/admin/questions/${questionId}/options`,
  adminDeleteGlobalQuestion: (questionId) => `/api/admin/questions/${questionId}`,
  adminModePoolSummary: (mode) => `/api/admin/modes/${mode}/pool`,
  adminModePoolIds: (mode) => `/api/admin/modes/${mode}/pool/ids`,
  adminSeedModePool: (mode) => `/api/admin/modes/${mode}/pool/seed`,
  adminModePoolQuestions: (mode) => `/api/admin/modes/${mode}/pool/questions`,
  adminRemoveModePool: (mode) => `/api/admin/modes/${mode}/pool`,
  adminReplaceModePool: (mode) => `/api/admin/modes/${mode}/pool`,
  adminStoryLevelPoolQuestions: (levelId) => `/api/admin/story/levels/${levelId}/pool/questions`,
  adminStoryLevelPoolIds: (levelId) => `/api/admin/story/levels/${levelId}/pool/ids`,
  adminRemoveStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,
  adminReplaceStoryLevelPool: (levelId) => `/api/admin/story/levels/${levelId}/pool`,
  adminQuizReports: () => '/api/admin/reports',
  adminResolveQuizReport: (reportId) => `/api/admin/reports/${reportId}/resolve`,
  adminDeleteCustomQuiz: (quizId) => `/api/admin/quizzes/${quizId}`,
  adminBanUser: (userId) => `/api/admin/users/${userId}/ban`,

  // classic category pools (classic mode only)
  adminClassicCategories: () => '/api/admin/classic/categories',
  adminCreateClassicCategory: () => '/api/admin/classic/categories',
  adminDeleteClassicCategory: (categoryId) => `/api/admin/classic/categories/${categoryId}`,
  adminClassicCategoryPoolQuestions: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool/questions`,
  adminClassicCategoryPoolIds: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool/ids`,
  adminAddClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminRemoveClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminReplaceClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool`,
  adminSeedClassicCategoryPool: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/pool/seed`,

  // classic category levels (classic mode only)
  adminClassicCategoryLevels: (categoryId) => `/api/admin/classic/categories/${categoryId}/levels`,
  adminCreateClassicCategoryLevel: (categoryId) =>
    `/api/admin/classic/categories/${categoryId}/levels`,
  adminDeleteClassicCategoryLevel: (levelId) => `/api/admin/classic/levels/${levelId}`,
  adminClassicLevelPoolQuestions: (levelId) =>
    `/api/admin/classic/levels/${levelId}/pool/questions`,
  adminClassicLevelPoolIds: (levelId) => `/api/admin/classic/levels/${levelId}/pool/ids`,
  adminAddClassicLevelPool: (levelId) => `/api/admin/classic/levels/${levelId}/pool`,
  adminRemoveClassicLevelPool: (levelId) => `/api/admin/classic/levels/${levelId}/pool`,
  adminReplaceClassicLevelPool: (levelId) => `/api/admin/classic/levels/${levelId}/pool`,
  adminSeedClassicLevelPool: (levelId) => `/api/admin/classic/levels/${levelId}/pool/seed`,
};
