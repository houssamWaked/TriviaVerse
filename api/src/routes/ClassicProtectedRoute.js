/**
 * Classic category levels protected routes.
 *
 * Mounted at `/api/classic`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { param } from 'express-validator';

export default function createClassicProtectedRouter(classicController) {
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

