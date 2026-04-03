/**
 * "Me" routes (current authenticated user).
 *
 * Mounted at `/api/me`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

type MeControllerLike = {
  profile: Parameters<typeof asyncHandler>[0];
  resetProgress: Parameters<typeof asyncHandler>[0];
};

export default function createMeRouter(meController: MeControllerLike) {
  const router = Router();
  router.get('/profile', requireAuth, asyncHandler(meController.profile));
  router.post('/reset-progress', requireAuth, asyncHandler(meController.resetProgress));
  return router;
}
