/**
 * Classic category levels protected routes.
 *
 * Mounted at `/api/classic`.
 */
import { Router } from 'express';
import { param } from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';

type ClassicControllerLike = {
  progress: Parameters<typeof asyncHandler>[0];
};

export default function createClassicProtectedRouter(classicController: ClassicControllerLike) {
  const router = Router();
  router.get(
    '/categories/:category_id/progress',
    requireAuth,
    param('category_id').isUUID().withMessage('category_id must be a valid UUID'),
    validateRequest,
    asyncHandler(classicController.progress)
  );
  return router;
}
