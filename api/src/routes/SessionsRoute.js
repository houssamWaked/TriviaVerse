/**
 * Shared session gameplay routes.
 *
 * Mounted at `/api/sessions`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
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
    requireAuth,
    sessionIdParam,
    validateRequest,
    asyncHandler(sessionsController.current)
  );

  router.post(
    '/:session_id/answer',
    requireAuth,
    sessionIdParam,
    answerValidator,
    validateRequest,
    asyncHandler(sessionsController.answer)
  );

  router.post(
    '/:session_id/lifelines/use',
    requireAuth,
    sessionIdParam,
    lifelineValidator,
    validateRequest,
    asyncHandler(sessionsController.useLifeline)
  );

  router.post(
    '/:session_id/finish',
    requireAuth,
    sessionIdParam,
    finishValidator,
    validateRequest,
    asyncHandler(sessionsController.finish)
  );

  return router;
}

