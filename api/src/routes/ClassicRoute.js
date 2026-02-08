/**
 * Classic mode routes.
 *
 * Mounted at `/api/classic`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { classicStartValidator } from '../validator/ModeSessionValidator.js';

export default function createClassicRouter(classicController) {
  const router = Router();

  router.post(
    '/sessions/start',
    optionalAuth,
    classicStartValidator,
    validateRequest,
    asyncHandler(classicController.start)
  );

  return router;
}
