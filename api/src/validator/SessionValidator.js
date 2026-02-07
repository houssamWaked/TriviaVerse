/**
 * Session validators (shared gameplay endpoints).
 */
import { body, param } from 'express-validator';

export const sessionIdParam = [
  param('session_id').isUUID().withMessage('session_id must be a valid UUID'),
];

export const answerValidator = [
  body('session_question_id')
    .isUUID()
    .withMessage('session_question_id must be a valid UUID'),
  body('chosen_option_id')
    .isUUID()
    .withMessage('chosen_option_id must be a valid UUID'),
  body('answered_in_sec')
    .optional()
    .isInt({ min: 0, max: 3600 })
    .withMessage('answered_in_sec must be >= 0'),
];

export const lifelineValidator = [
  body('lifeline_type')
    .isIn(['fifty_fifty', 'skip', 'audience', 'phone'])
    .withMessage('lifeline_type is invalid'),
  body('session_question_id')
    .isUUID()
    .withMessage('session_question_id must be a valid UUID'),
];

export const finishValidator = [
  body('status')
    .isIn(['completed', 'abandoned'])
    .withMessage('status must be completed or abandoned'),
];
