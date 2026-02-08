/**
 * Story mode routes.
 *
 * Mounted at `/api/story`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { storyStartValidator } from '../validator/ModeSessionValidator.js';

export default function createStoryRouter(storyController) {
  const router = Router();

  router.get('/levels', asyncHandler(storyController.listLevels));
  router.get('/progress', requireAuth, asyncHandler(storyController.progress));

  router.post(
    '/sessions/start',
    optionalAuth,
    storyStartValidator,
    validateRequest,
    asyncHandler(storyController.start)
  );

  return router;
}
