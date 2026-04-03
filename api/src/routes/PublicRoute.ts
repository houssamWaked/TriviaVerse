/**
 * Public routes (no auth).
 *
 * Mounted at `/api/public`.
 */
import { Router } from 'express';
import { query } from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { quizIdParam, quizSearchQuery } from '../validator/QuizDiscoveryValidator.js';

type PublicControllerLike = {
  homeMetrics: Parameters<typeof asyncHandler>[0];
};

type QuizDiscoveryControllerLike = {
  top: Parameters<typeof asyncHandler>[0];
  search: Parameters<typeof asyncHandler>[0];
  getQuiz: Parameters<typeof asyncHandler>[0];
  ratings: Parameters<typeof asyncHandler>[0];
  leaderboard: Parameters<typeof asyncHandler>[0];
};

export default function createPublicRouter(
  publicController: PublicControllerLike,
  quizDiscoveryController: QuizDiscoveryControllerLike
) {
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
