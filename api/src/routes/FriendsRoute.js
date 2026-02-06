/**
 * Friends routes.
 *
 * Mounted at `/api/friends`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  friendUserIdParam,
  requestIdParam,
  sendFriendRequestBody,
} from '../validator/FriendsValidator.js';

export default function createFriendsRouter(friendController) {
  const router = Router();

  router.get('/', requireAuth, asyncHandler(friendController.listFriends));

  router.get('/requests', requireAuth, asyncHandler(friendController.listRequests));

  router.post(
    '/requests',
    requireAuth,
    sendFriendRequestBody,
    validateRequest,
    asyncHandler(friendController.sendRequest)
  );

  router.post(
    '/requests/:request_id/accept',
    requireAuth,
    requestIdParam,
    validateRequest,
    asyncHandler(friendController.acceptRequest)
  );

  router.post(
    '/requests/:request_id/decline',
    requireAuth,
    requestIdParam,
    validateRequest,
    asyncHandler(friendController.declineRequest)
  );

  router.delete(
    '/requests/:request_id',
    requireAuth,
    requestIdParam,
    validateRequest,
    asyncHandler(friendController.cancelRequest)
  );

  router.get(
    '/:friend_user_id/stats',
    requireAuth,
    friendUserIdParam,
    validateRequest,
    asyncHandler(friendController.friendStats)
  );

  return router;
}

