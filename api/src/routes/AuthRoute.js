/**
 * Auth routes.
 *
 * Mounted at `/api/auth`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  loginValidator,
  registerValidator,
  resendVerificationValidator,
  verifyEmailGetValidator,
  verifyEmailPostValidator,
} from '../validator/AuthValidator.js';

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

  router.get(
    '/verify-email',
    verifyEmailGetValidator,
    validateRequest,
    asyncHandler(authController.verifyEmail)
  );

  router.post(
    '/verify-email',
    verifyEmailPostValidator,
    validateRequest,
    asyncHandler(authController.verifyEmail)
  );

  router.post(
    '/resend-verification',
    resendVerificationValidator,
    validateRequest,
    asyncHandler(authController.resendVerification)
  );

  return router;
}
