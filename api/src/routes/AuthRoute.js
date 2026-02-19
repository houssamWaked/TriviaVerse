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
  googleAuthValidator,
} from '../validator/AuthValidator.js';

export default function createAuthRouter(authController) {
  const router = Router();

  // This endpoint is POST-only (expects a Google ID token).
  // Provide a helpful response for accidental browser GETs.
  router.get('/google', (req, res) =>
    res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Use POST /api/auth/google with JSON body: { "id_token": "<google id token>" }',
    })
  );

  router.post(
    '/register',
    registerValidator,
    validateRequest,
    asyncHandler(authController.register)
  );

  router.post('/login', loginValidator, validateRequest, asyncHandler(authController.login));

  router.post('/google', googleAuthValidator, validateRequest, asyncHandler(authController.google));

  router.post('/refresh', asyncHandler(authController.refresh));
  router.post('/logout', asyncHandler(authController.logout));

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
