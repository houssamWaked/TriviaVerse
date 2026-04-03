/**
 * Auth validators.
 */
import { body, query } from 'express-validator';

export const registerValidator = [
  body('username')
    .isString()
    .withMessage('username must be a string')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('email must be a valid email').normalizeEmail(),
  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 8, max: 128 })
    .withMessage('password must be between 8 and 128 characters'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('email must be a valid email').normalizeEmail(),
  body('password')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 1 })
    .withMessage('password is required'),
];

export const verifyEmailPostValidator = [
  body('token').isString().trim().notEmpty().withMessage('token is required'),
];

export const verifyEmailGetValidator = [
  query('token').isString().trim().notEmpty().withMessage('token is required'),
];

export const resendVerificationValidator = [
  body('email').isEmail().withMessage('email must be a valid email').normalizeEmail(),
];

export const googleAuthValidator = [
  body('id_token')
    .isString()
    .withMessage('id_token must be a string')
    .trim()
    .notEmpty()
    .withMessage('id_token is required'),
];
