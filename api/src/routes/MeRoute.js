/**
 * "Me" routes (current authenticated user).
 *
 * Mounted at `/api/me`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

export default function createMeRouter(meController) {
  const router = Router();

  router.get('/profile', requireAuth, asyncHandler(meController.profile));

  return router;
}
