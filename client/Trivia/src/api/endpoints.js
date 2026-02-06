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
};
