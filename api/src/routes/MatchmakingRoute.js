/**
 * Matchmaking routes.
 *
 * Mounted at `/api/matchmaking` (protected).
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  blitzMatchFindValidator,
  requestIdParamValidator,
} from '../validator/ModeSessionValidator.js';

export default function createMatchmakingRouter(matchmakingController) {
  const router = Router();

  router.post(
    '/blitz/find',
    blitzMatchFindValidator,
    validateRequest,
    asyncHandler(matchmakingController.findBlitz)
  );

  router.get(
    '/blitz/:request_id',
    requestIdParamValidator,
    validateRequest,
    asyncHandler(matchmakingController.blitzStatus)
  );

  router.post(
    '/blitz/:request_id/cancel',
    requestIdParamValidator,
    validateRequest,
    asyncHandler(matchmakingController.cancelBlitz)
  );

  return router;
}
