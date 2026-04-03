/**
 * Friends controller.
 */
import type { Request, Response } from 'express';

type FriendServiceLike = {
  sendRequest(userId: string, username: string): Promise<unknown>;
  listRequests(userId: string): Promise<unknown>;
  acceptRequest(userId: string, requestId: string): Promise<unknown>;
  declineRequest(userId: string, requestId: string): Promise<unknown>;
  cancelRequest(userId: string, requestId: string): Promise<unknown>;
  listFriends(userId: string): Promise<unknown>;
  getFriendProfile(userId: string, friendUserId: string): Promise<unknown>;
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
    res.status(201).json(data);
  };

  listRequests = async (req: Request, res: Response) => {
    const data = await this.friendService.listRequests(req.user!.id);
    res.status(200).json(data);
  };

  acceptRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.acceptRequest(req.user!.id, getParam(req.params.request_id));
    res.status(200).json(data);
  };

  declineRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.declineRequest(req.user!.id, getParam(req.params.request_id));
    res.status(200).json(data);
  };

  cancelRequest = async (req: Request, res: Response) => {
    const data = await this.friendService.cancelRequest(req.user!.id, getParam(req.params.request_id));
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
