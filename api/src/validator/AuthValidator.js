/**
 * Auth validators.
 */
import { body } from 'express-validator';

export const registerValidator = [
  body('username')
    .isString()
    .withMessage('username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('username must be between 3 and 30 characters'),

  body('email')
    .isEmail()
    .withMessage('email must be a valid email')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 8, max: 128 })
    .withMessage('password must be between 8 and 128 characters'),
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('email must be a valid email')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 1 })
    .withMessage('password is required'),
];

