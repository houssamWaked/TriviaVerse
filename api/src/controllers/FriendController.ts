/**
 * Friends controller.
 */
import type { Request, Response } from 'express';
import { emitFriendsChanged } from '../socket.js';

type FriendServiceLike = {
  sendRequest(userId: string, username: string): Promise<any>;
  listRequests(userId: string): Promise<any>;
  acceptRequest(userId: string, requestId: string): Promise<any>;
  declineRequest(userId: string, requestId: string): Promise<any>;
  cancelRequest(userId: string, requestId: string): Promise<any>;
  listFriends(userId: string): Promise<any>;
  getFriendProfile(userId: string, friendUserId: string): Promise<any>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

// HTTP adapter for friends (requests, accept/decline/cancel, friend list and profiles).
export class FriendController {
  friendService: FriendServiceLike;

  /**
   * Construct a controller that delegates to the friend service.
   * @param friendService Service implementing social/friends operations.
   * @returns A `FriendController` instance.
   */
  constructor(friendService: FriendServiceLike) {
    this.friendService = friendService;
  }

  /**
   * Send a friend request and emit realtime updates to both users.
   * @param req Express request (expects `{ username }` in `req.body`).
   * @param res Express response.
   * @returns A 201 response with request info.
   */
  sendRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.sendRequest(req.user!.id, req.body.username);
    emitFriendsChanged([req.user!.id, data?.user?.id], {
      reason: 'request_sent',
      byUserId: req.user!.id,
      otherUserId: data?.user?.id || null,
    });
    res.status(201).json(data);
  };

  /**
   * List incoming/outgoing friend requests.
   * @param req Express request.
   * @param res Express response.
   * @returns A 200 response with request lists.
   */
  listRequests = async (req: Request, res: Response) => {
    const data = await this.friendService.listRequests(req.user!.id);
    res.status(200).json(data);
  };

  /**
   * Accept a friend request and emit realtime updates to both users.
   * @param req Express request (expects `:request_id`).
   * @param res Express response.
   * @returns A 200 response with friend relationship info.
   */
  acceptRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.acceptRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.friend?.id], {
      reason: 'request_accepted',
      byUserId: req.user!.id,
      otherUserId: data?.friend?.id || null,
    });
    res.status(200).json(data);
  };

  /**
   * Decline a friend request and emit realtime updates to both users.
   * @param req Express request (expects `:request_id`).
   * @param res Express response.
   * @returns A 200 response with the other user id (when available).
   */
  declineRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.declineRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.other_user_id], {
      reason: 'request_declined',
      byUserId: req.user!.id,
      otherUserId: data?.other_user_id || null,
    });
    res.status(200).json(data);
  };

  /**
   * Cancel a previously sent friend request and emit realtime updates to both users.
   * @param req Express request (expects `:request_id`).
   * @param res Express response.
   * @returns A 200 response with the other user id (when available).
   */
  cancelRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.cancelRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.other_user_id], {
      reason: 'request_canceled',
      byUserId: req.user!.id,
      otherUserId: data?.other_user_id || null,
    });
    res.status(200).json(data);
  };

  /**
   * List the current user's friends.
   * @param req Express request.
   * @param res Express response.
   * @returns A 200 response with `{ friends }`.
   */
  listFriends = async (req: Request, res: Response) => {
    const data = await this.friendService.listFriends(req.user!.id);
    res.status(200).json({ friends: data });
  };

  /**
   * Fetch a friend's public profile as viewed by the current user.
   * @param req Express request (expects `:friend_user_id`).
   * @param res Express response.
   * @returns A 200 response with profile data.
   */
  friendProfile = async (req: Request, res: Response) => {
    const data = await this.friendService.getFriendProfile(
      req.user!.id,
      getParam(req.params.friend_user_id)
    );
    res.status(200).json(data);
  };
}
