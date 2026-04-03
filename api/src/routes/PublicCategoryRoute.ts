/**
 * Public category routes (read-only).
 *
 * Mounted at `/api/public/categories`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { idParam } from '../validator/CategoryValidator.js';

type CategoryControllerLike = {
  list: Parameters<typeof asyncHandler>[0];
  stats: Parameters<typeof asyncHandler>[0];
};

export default function createPublicCategoryRouter(categoryController: CategoryControllerLike) {
  const router = Router();
  router.get('/', asyncHandler(categoryController.list));
  router.get('/:id/stats', idParam, validateRequest, asyncHandler(categoryController.stats));
  return router;
}
