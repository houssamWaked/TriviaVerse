/**
 * Blitz mode routes.
 *
 * Mounted at `/api/blitz`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { blitzStartValidator } from '../validator/ModeSessionValidator.js';

export default function createBlitzRouter(blitzController) {
  const router = Router();

  router.get('/config', asyncHandler(blitzController.config));
  router.post(
    '/sessions/start',
    optionalAuth,
    blitzStartValidator,
    validateRequest,
    asyncHandler(blitzController.start)
  );

  return router;
}
