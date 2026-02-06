/**
 * Quiz discovery validators.
 */
import { body, param, query } from 'express-validator';

export const quizSearchQuery = [
  query('q')
    .isString()
    .withMessage('q must be a string')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('q must be between 1 and 120 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),
];

export const quizIdParam = [
  param('quiz_id').isUUID().withMessage('quiz_id must be a valid UUID'),
];

export const ratingBody = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('rating must be between 1 and 5'),
];

export const accessBody = [
  body('username')
    .isString()
    .withMessage('username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('username must be between 3 and 30 characters'),
];

export const accessUserIdParam = [
  param('user_id').isUUID().withMessage('user_id must be a valid UUID'),
];

