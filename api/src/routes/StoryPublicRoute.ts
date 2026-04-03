/**
 * Public Story mode routes.
 *
 * Mounted at `/api/public/story`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { storyStartValidator } from '../validator/ModeSessionValidator.js';

type StoryControllerLike = {
  listLevels: Parameters<typeof asyncHandler>[0];
  start: Parameters<typeof asyncHandler>[0];
};

export default function createStoryPublicRouter(storyController: StoryControllerLike) {
  const router = Router();
  router.get('/levels', asyncHandler(storyController.listLevels));
  router.post(
    '/sessions/start',
    optionalAuth,
    storyStartValidator,
    validateRequest,
    asyncHandler(storyController.start)
  );
  return router;
}
