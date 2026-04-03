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

type FriendControllerLike = {
  listFriends: Parameters<typeof asyncHandler>[0];
  listRequests: Parameters<typeof asyncHandler>[0];
  sendRequest: Parameters<typeof asyncHandler>[0];
  acceptRequest: Parameters<typeof asyncHandler>[0];
  declineRequest: Parameters<typeof asyncHandler>[0];
  cancelRequest: Parameters<typeof asyncHandler>[0];
  friendProfile: Parameters<typeof asyncHandler>[0];
};

export default function createFriendsRouter(friendController: FriendControllerLike) {
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
    '/:friend_user_id/profile',
    requireAuth,
    friendUserIdParam,
    validateRequest,
    asyncHandler(friendController.friendProfile)
  );
  return router;
}
