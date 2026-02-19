/**
 * Category request validators (express-validator).
 *
 * These validators are designed to be used with:
 * - `validateRequest` middleware to convert validation failures into `AppError`
 * - `asyncHandler` wrappers so thrown errors reach the global error handler
 *
 * General rules:
 * - `idParam` enforces UUID ids in `/:id` routes
 */
import { param } from 'express-validator';

/**
 * UUID param validator (Supabase style)
 */
export const idParam = [param('id').isUUID().withMessage('id must be a valid UUID')];
