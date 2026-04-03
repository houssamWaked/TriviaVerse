/**
 * Leaderboard routes.
 *
 * Mounted at `/api/public/leaderboard`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { leaderboardQuery } from '../validator/LeaderboardValidator.js';

type LeaderboardControllerLike = {
  get: Parameters<typeof asyncHandler>[0];
};

export default function createLeaderboardRouter(leaderboardController: LeaderboardControllerLike) {
  const router = Router();
  router.get('/', leaderboardQuery, validateRequest, asyncHandler(leaderboardController.get));
  return router;
}
