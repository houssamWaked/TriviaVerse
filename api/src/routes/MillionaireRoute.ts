/**
 * Millionaire mode routes.
 *
 * Mounted at `/api/public/millionaire`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { millionaireStartValidator } from '../validator/ModeSessionValidator.js';

type MillionaireControllerLike = {
  config: Parameters<typeof asyncHandler>[0];
  start: Parameters<typeof asyncHandler>[0];
};

export default function createMillionaireRouter(millionaireController: MillionaireControllerLike) {
  const router = Router();
  router.get('/config', asyncHandler(millionaireController.config));
  router.post(
    '/sessions/start',
    optionalAuth,
    millionaireStartValidator,
    validateRequest,
    asyncHandler(millionaireController.start)
  );
  return router;
}
