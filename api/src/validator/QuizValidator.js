/**
 * Quiz builder validators.
 */
import { body, param } from 'express-validator';

export const quizIdParam = [
  param('quiz_id').isUUID().withMessage('quiz_id must be a valid UUID'),
];

export const questionIdParam = [
  param('question_id').isUUID().withMessage('question_id must be a valid UUID'),
];

export const optionIdParam = [
  param('option_id').isUUID().withMessage('option_id must be a valid UUID'),
];

export const createQuizValidator = [
  body('title')
    .isString()
    .withMessage('title must be a string')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('title must be between 1 and 120 characters'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('description must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('description must be at most 1000 characters'),

  body('keywords')
    .optional({ nullable: true })
    .isString()
    .withMessage('keywords must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('keywords must be at most 200 characters'),

  body('cover_image_url')
    .optional({ nullable: true })
    .isString()
    .withMessage('cover_image_url must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('cover_image_url must be at most 500 characters'),

  body('visibility')
    .optional()
    .isIn(['private', 'public', 'unlisted'])
    .withMessage('visibility is invalid'),
];

export const patchQuizValidator = [
  body('title')
    .optional()
    .isString()
    .withMessage('title must be a string')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('title must be between 1 and 120 characters'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('description must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('description must be at most 1000 characters'),

  body('keywords')
    .optional({ nullable: true })
    .isString()
    .withMessage('keywords must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('keywords must be at most 200 characters'),

  body('cover_image_url')
    .optional({ nullable: true })
    .isString()
    .withMessage('cover_image_url must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('cover_image_url must be at most 500 characters'),

  body('visibility')
    .optional()
    .isIn(['private', 'public', 'unlisted'])
    .withMessage('visibility is invalid'),
];

export const addQuestionValidator = [
  body('question_text')
    .isString()
    .withMessage('question_text must be a string')
    .trim()
    .isLength({ min: 5, max: 600 })
    .withMessage('question_text must be between 5 and 600 characters'),
  body('explanation')
    .optional({ nullable: true })
    .isString()
    .withMessage('explanation must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('explanation must be at most 2000 characters'),
  body('time_limit_sec')
    .optional()
    .isInt({ min: 3, max: 600 })
    .withMessage('time_limit_sec must be between 3 and 600'),
  body('points')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('points must be >= 0'),
  body('order_index')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('order_index must be >= 1'),
];

export const patchQuestionValidator = [
  body('question_text')
    .optional()
    .isString()
    .withMessage('question_text must be a string')
    .trim()
    .isLength({ min: 5, max: 600 })
    .withMessage('question_text must be between 5 and 600 characters'),
  body('explanation')
    .optional({ nullable: true })
    .isString()
    .withMessage('explanation must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('explanation must be at most 2000 characters'),
  body('time_limit_sec')
    .optional()
    .isInt({ min: 3, max: 600 })
    .withMessage('time_limit_sec must be between 3 and 600'),
  body('points')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('points must be >= 0'),
  body('order_index')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('order_index must be >= 1'),
];

export const addOptionValidator = [
  body('option_text')
    .isString()
    .withMessage('option_text must be a string')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('option_text must be between 1 and 300 characters'),
  body('is_correct')
    .optional()
    .isBoolean()
    .withMessage('is_correct must be a boolean'),
  body('order_index')
    .isInt({ min: 1, max: 100 })
    .withMessage('order_index must be >= 1'),
];

export const patchOptionValidator = [
  body('option_text')
    .optional()
    .isString()
    .withMessage('option_text must be a string')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('option_text must be between 1 and 300 characters'),
  body('is_correct')
    .optional()
    .isBoolean()
    .withMessage('is_correct must be a boolean'),
  body('order_index')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('order_index must be >= 1'),
];

export const shareQuizValidator = [
  body('visibility')
    .isIn(['unlisted'])
    .withMessage('visibility must be unlisted'),
];

export const reportQuizBody = [
  body('reason')
    .optional()
    .isString()
    .trim()
    .isIn(['spam', 'hate', 'copyright', 'wrong_answers', 'other'])
    .withMessage('reason is invalid'),
  body('message')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ min: 0, max: 2000 })
    .withMessage('message must be at most 2000 characters'),
];
