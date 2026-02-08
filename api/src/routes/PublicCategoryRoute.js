/**
 * Public category routes (read-only).
 *
 * Mounted at `/api/public/categories`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { idParam, searchQuery } from '../validator/CategoryValidator.js';

export default function createPublicCategoryRouter(categoryController) {
  const router = Router();

  router.get('/', asyncHandler(categoryController.list));

  router.get(
    '/search',
    searchQuery,
    validateRequest,
    asyncHandler(categoryController.search)
  );

  router.get(
    '/:id/stats',
    idParam,
    validateRequest,
    asyncHandler(categoryController.stats)
  );

  router.get(
    '/:id',
    idParam,
    validateRequest,
    asyncHandler(categoryController.get)
  );

  return router;
}

