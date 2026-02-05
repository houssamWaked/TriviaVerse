/**
 * Millionaire mode routes.
 *
 * Mounted at `/api/millionaire`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { millionaireStartValidator } from '../validator/ModeSessionValidator.js';

export default function createMillionaireRouter(millionaireController) {
  const router = Router();

  router.get('/config', asyncHandler(millionaireController.config));
  router.post(
    '/sessions/start',
    requireAuth,
    millionaireStartValidator,
    validateRequest,
    asyncHandler(millionaireController.start)
  );

  return router;
}

