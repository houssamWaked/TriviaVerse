/**
 * Story mode protected routes.
 *
 * Mounted at `/api/story`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default function createStoryRouter(storyController) {
  const router = Router();

  router.get('/progress', requireAuth, asyncHandler(storyController.progress));

  return router;
}
