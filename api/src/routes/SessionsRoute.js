/**
 * Shared session gameplay routes.
 *
 * Mounted at `/api/sessions`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import {
  answerValidator,
  finishValidator,
  lifelineValidator,
  sessionIdParam,
} from '../validator/SessionValidator.js';

export default function createSessionsRouter(sessionsController) {
  const router = Router();

  router.get(
    '/:session_id/current',
    optionalAuth,
    sessionIdParam,
    validateRequest,
    asyncHandler(sessionsController.current)
  );

  router.post(
    '/:session_id/answer',
    optionalAuth,
    sessionIdParam,
    answerValidator,
    validateRequest,
    asyncHandler(sessionsController.answer)
  );

  router.post(
    '/:session_id/lifelines/use',
    optionalAuth,
    sessionIdParam,
    lifelineValidator,
    validateRequest,
    asyncHandler(sessionsController.useLifeline)
  );

  router.post(
    '/:session_id/finish',
    optionalAuth,
    sessionIdParam,
    finishValidator,
    validateRequest,
    asyncHandler(sessionsController.finish)
  );

  return router;
}
