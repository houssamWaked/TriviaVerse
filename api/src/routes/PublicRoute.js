/**
 * Public routes (no auth).
 *
 * Mounted at `/api/public`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { quizIdParam, quizSearchQuery } from '../validator/QuizDiscoveryValidator.js';
import { query } from 'express-validator';

export default function createPublicRouter(publicController, quizDiscoveryController) {
  const router = Router();

  router.get('/home-metrics', asyncHandler(publicController.homeMetrics));

  router.get(
    '/quizzes/top',
    optionalAuth,
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validateRequest,
    asyncHandler(quizDiscoveryController.top)
  );

  router.get(
    '/quizzes/search',
    optionalAuth,
    quizSearchQuery,
    validateRequest,
    asyncHandler(quizDiscoveryController.search)
  );

  router.get(
    '/quizzes/:quiz_id',
    optionalAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizDiscoveryController.getQuiz)
  );

  router.get(
    '/quizzes/:quiz_id/ratings',
    optionalAuth,
    quizIdParam,
    validateRequest,
    asyncHandler(quizDiscoveryController.ratings)
  );

  router.get(
    '/quizzes/:quiz_id/leaderboard',
    optionalAuth,
    quizIdParam,
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validateRequest,
    asyncHandler(quizDiscoveryController.leaderboard)
  );

  return router;
}
