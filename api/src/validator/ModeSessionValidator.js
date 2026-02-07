/**
 * Game mode session start validators.
 */
import { body } from 'express-validator';

export const storyStartValidator = [
  body('level_number')
    .isInt({ min: 1, max: 10000 })
    .withMessage('level_number must be >= 1'),
];

export const millionaireStartValidator = [
  body('ladder_id').optional().isUUID().withMessage('ladder_id must be a valid UUID'),
];

export const classicStartValidator = [
  body('category_id').isUUID().withMessage('category_id must be a valid UUID'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('difficulty is invalid'),
  body('questions_count')
    .isInt({ min: 1, max: 50 })
    .withMessage('questions_count must be between 1 and 50'),
];

export const blitzStartValidator = [
  body('category_id').isUUID().withMessage('category_id must be a valid UUID'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('difficulty is invalid'),
];
