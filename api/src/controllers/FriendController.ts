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

export class FriendController {
  friendService: FriendServiceLike;

  constructor(friendService: FriendServiceLike) {
    this.friendService = friendService;
  }

  sendRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.sendRequest(req.user!.id, req.body.username);
    emitFriendsChanged([req.user!.id, data?.user?.id], {
      reason: 'request_sent',
      byUserId: req.user!.id,
      otherUserId: data?.user?.id || null,
    });
    res.status(201).json(data);
  };

  listRequests = async (req: Request, res: Response) => {
    const data = await this.friendService.listRequests(req.user!.id);
    res.status(200).json(data);
  };

  acceptRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.acceptRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.friend?.id], {
      reason: 'request_accepted',
      byUserId: req.user!.id,
      otherUserId: data?.friend?.id || null,
    });
    res.status(200).json(data);
  };

  declineRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.declineRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.other_user_id], {
      reason: 'request_declined',
      byUserId: req.user!.id,
      otherUserId: data?.other_user_id || null,
    });
    res.status(200).json(data);
  };

  cancelRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.cancelRequest(req.user!.id, getParam(req.params.request_id));
    emitFriendsChanged([req.user!.id, data?.other_user_id], {
      reason: 'request_canceled',
      byUserId: req.user!.id,
      otherUserId: data?.other_user_id || null,
    });
    res.status(200).json(data);
  };

  listFriends = async (req: Request, res: Response) => {
    const data = await this.friendService.listFriends(req.user!.id);
    res.status(200).json({ friends: data });
  };

  friendProfile = async (req: Request, res: Response) => {
    const data = await this.friendService.getFriendProfile(
      req.user!.id,
      getParam(req.params.friend_user_id)
    );
    res.status(200).json(data);
  };
}
