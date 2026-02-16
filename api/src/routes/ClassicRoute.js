/**
 * Classic mode routes.
 *
 * Mounted at `/api/public/classic`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { classicStartValidator } from '../validator/ModeSessionValidator.js';
import { param } from 'express-validator';

export default function createClassicRouter(classicController) {
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
