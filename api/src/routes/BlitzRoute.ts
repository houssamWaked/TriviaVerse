/**
 * Blitz mode routes.
 *
 * Mounted at `/api/public/blitz`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { blitzStartValidator } from '../validator/ModeSessionValidator.js';

type BlitzControllerLike = {
  config: Parameters<typeof asyncHandler>[0];
  start: Parameters<typeof asyncHandler>[0];
};

export default function createBlitzRouter(blitzController: BlitzControllerLike) {
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
