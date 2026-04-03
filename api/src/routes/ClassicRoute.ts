/**
 * Classic mode routes.
 *
 * Mounted at `/api/public/classic`.
 */
import { Router } from 'express';
import { param } from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { classicStartValidator } from '../validator/ModeSessionValidator.js';

type ClassicControllerLike = {
  listLevels: Parameters<typeof asyncHandler>[0];
  start: Parameters<typeof asyncHandler>[0];
};

export default function createClassicRouter(classicController: ClassicControllerLike) {
  const router = Router();
  router.get(
    '/categories/:category_id/levels',
    param('category_id').isUUID().withMessage('category_id must be a valid UUID'),
    validateRequest,
    asyncHandler(classicController.listLevels)
  );
  router.post(
    '/sessions/start',
    optionalAuth,
    classicStartValidator,
    validateRequest,
    asyncHandler(classicController.start)
  );
  return router;
}
