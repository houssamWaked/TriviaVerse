/**
 * Category HTTP routes.
 *
 * Design:
 * - This router is a *factory* that receives a controller instance.
 * - The router remains free of domain wiring (DI stays in `src/app.js`).
 *
 * Response shape:
 * - Successful responses return DTOs (see `domain/dto/CategoryDTO.js`).
 * - Validation errors throw `AppError(code=VALIDATION_ERROR)` via `validateRequest`.
 *
 * Routes mounted at: `/api/categories`
 *
 * Endpoints:
 * - `GET /`                 -> list categories
 * - `GET /search?q=...`     -> search categories by name
 * - `POST /`                -> create category
 * - `PUT /:id`              -> update category
 * - `GET /:id`              -> get category by id
 * - `DELETE /:id`           -> delete category
 */
import { Router } from 'express';
import {
  createCategory,
  updateCategory,
  idParam,
  searchQuery,
} from '../validator/CategoryValidator.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import asyncHandler from '../utils/asyncHandler.js';

export default function createCategoryRouter(categoryController) {
  const router = Router();

  router.get('/', asyncHandler(categoryController.list));

  router.get(
    '/search',
    searchQuery,
    validateRequest,
    asyncHandler(categoryController.search)
  );

  router.post(
    '/',
    createCategory,
    validateRequest,
    asyncHandler(categoryController.create)
  );
  router.put(
    '/:id',
    idParam,
    updateCategory,
    validateRequest,
    asyncHandler(categoryController.update)
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
  router.delete(
    '/:id',
    idParam,
    validateRequest,
    asyncHandler(categoryController.delete)
  );

  return router;
}
