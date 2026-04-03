/**
 * Game mode session start validators.
 */
import { body, param } from 'express-validator';

export const storyStartValidator = [
  body('level_number').isInt({ min: 1, max: 10000 }).withMessage('level_number must be >= 1'),
];

export const millionaireStartValidator = [
  body('ladder_id').optional().isUUID().withMessage('ladder_id must be a valid UUID'),
];

export const classicStartValidator = [
  body('category_id').isUUID().withMessage('category_id must be a valid UUID'),
  body('level_number')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10000 })
    .withMessage('level_number must be >= 1'),
  body('difficulty')
    .optional({ nullable: true })
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('difficulty is invalid'),
  body('questions_count')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 50 })
    .withMessage('questions_count must be between 1 and 50'),
  body().custom((_, { req }) => {
    const hasLevel = req.body?.level_number != null;
    if (hasLevel) return true;
    if (!req.body?.difficulty || req.body?.questions_count == null) {
      throw new Error(
        'difficulty and questions_count are required when level_number is not provided'
      );
    }
    return true;
  }),
];

export const blitzStartValidator = [
  body('category_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('category_id must be a valid UUID'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('difficulty is invalid'),
];

export const blitzMatchFindValidator = [
  body('category_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('category_id must be a valid UUID'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('difficulty is invalid'),
];

export const requestIdParamValidator = [
  param('request_id').isUUID().withMessage('request_id must be a valid UUID'),
];
