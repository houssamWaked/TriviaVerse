/**
 * Duels routes.
 *
 * Mounted at `/api/duels`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createDuelBody, duelIdParam, duelLiveAnswerBody } from '../validator/DuelValidator.js';

export default function createDuelsRouter(duelController) {
  const router = Router();

  router.get('/', requireAuth, asyncHandler(duelController.listMine));

  router.post('/', requireAuth, createDuelBody, validateRequest, asyncHandler(duelController.create));

  router.get(
    '/:duel_id',
    requireAuth,
    duelIdParam,
    validateRequest,
    asyncHandler(duelController.get)
  );

  router.post(
    '/:duel_id/accept',
    requireAuth,
    duelIdParam,
    validateRequest,
    asyncHandler(duelController.accept)
  );

  router.post(
    '/:duel_id/decline',
    requireAuth,
    duelIdParam,
    validateRequest,
    asyncHandler(duelController.decline)
  );

  router.post(
    '/:duel_id/cancel',
    requireAuth,
    duelIdParam,
    validateRequest,
    asyncHandler(duelController.cancel)
  );

  // live duel gameplay
  router.get(
    '/:duel_id/state',
    requireAuth,
    duelIdParam,
    validateRequest,
    asyncHandler(duelController.liveState)
  );
  router.post(
    '/:duel_id/answer',
    requireAuth,
    duelIdParam,
    duelLiveAnswerBody,
    validateRequest,
    asyncHandler(duelController.liveAnswer)
  );

  return router;
}
