/**
 * API endpoint helpers (paths only).
 *
 * Keep this file "dumb": no HTTP calls here—just route builders.
 */

export const endpoints = {
  // public
  homeMetrics: () => '/api/public/home-metrics',

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
  quizById: (quizId) => `/api/quizzes/${quizId}`,
  quizQuestions: (quizId) => `/api/quizzes/${quizId}/questions`,
  quizPublish: (quizId) => `/api/quizzes/${quizId}/publish`,
  quizShare: (quizId) => `/api/quizzes/${quizId}/share`,
  questionById: (questionId) => `/api/questions/${questionId}`,
  questionOptions: (questionId) => `/api/questions/${questionId}/options`,
  optionById: (optionId) => `/api/options/${optionId}`,
};

