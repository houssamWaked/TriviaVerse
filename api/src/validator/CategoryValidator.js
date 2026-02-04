/**
 * Category request validators (express-validator).
 *
 * These validators are designed to be used with:
 * - `validateRequest` middleware to convert validation failures into `AppError`
 * - `asyncHandler` wrappers so thrown errors reach the global error handler
 *
 * General rules:
 * - `createCategory` requires `name`
 * - `updateCategory` allows partial updates, but requires at least one field
 * - `idParam` enforces UUID ids in `/:id` routes
 * - `searchQuery` enforces `?q=` presence for `/search`
 */
import { body, param, query } from 'express-validator';

/**
 * UUID param validator (Supabase style)
 */
export const idParam = [
  param('id').isUUID().withMessage('id must be a valid UUID'),
];

export const searchQuery = [
  query('q')
    .isString()
    .withMessage('q must be a string')
    .trim()
    .notEmpty()
    .withMessage('q is required'),
];

/**
 * Create Category
 */
export const createCategory = [
  body('name')
    .isString()
    .withMessage('name must be a string')
    .isLength({ min: 2, max: 40 })
    .withMessage('name must be between 2 and 40 characters')
    .trim(),

  body('icon')
    .optional({ nullable: true })
    .isString()
    .withMessage('icon must be a string')
    .isLength({ max: 120 })
    .withMessage('icon must be at most 120 characters')
    .trim(),
];

/**
 * Update Category
 */
export const updateCategory = [
  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string')
    .isLength({ min: 2, max: 40 })
    .withMessage('name must be between 2 and 40 characters')
    .trim(),

  body('icon')
    .optional({ nullable: true })
    .isString()
    .withMessage('icon must be a string')
    .isLength({ max: 120 })
    .withMessage('icon must be at most 120 characters')
    .trim(),

  body().custom((_, { req }) => {
    const hasName = Object.prototype.hasOwnProperty.call(req.body, 'name');
    const hasIcon = Object.prototype.hasOwnProperty.call(req.body, 'icon');
    if (!hasName && !hasIcon) {
      throw new Error('At least one of name or icon is required');
    }
    return true;
  }),
];
