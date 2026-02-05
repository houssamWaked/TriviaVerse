/**
 * Auth routes.
 *
 * Mounted at `/api/auth`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginValidator, registerValidator } from '../validator/AuthValidator.js';

export default function createAuthRouter(authController) {
  const router = Router();

  router.post(
    '/register',
    registerValidator,
    validateRequest,
    asyncHandler(authController.register)
  );

  router.post(
    '/login',
    loginValidator,
    validateRequest,
    asyncHandler(authController.login)
  );

  return router;
}

