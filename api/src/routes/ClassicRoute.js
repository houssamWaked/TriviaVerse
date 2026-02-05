/**
 * Classic mode routes.
 *
 * Mounted at `/api/classic`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { classicStartValidator } from '../validator/ModeSessionValidator.js';

export default function createClassicRouter(classicController) {
  const router = Router();

  router.post(
    '/sessions/start',
    requireAuth,
    classicStartValidator,
    validateRequest,
    asyncHandler(classicController.start)
  );

  return router;
}

