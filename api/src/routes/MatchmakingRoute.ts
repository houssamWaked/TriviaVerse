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

type MatchmakingControllerLike = {
  findBlitz: Parameters<typeof asyncHandler>[0];
  blitzStatus: Parameters<typeof asyncHandler>[0];
  cancelBlitz: Parameters<typeof asyncHandler>[0];
};

export default function createMatchmakingRouter(matchmakingController: MatchmakingControllerLike) {
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
