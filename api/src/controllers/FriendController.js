/**
 * Friends controller.
 */
export class FriendController {
  constructor(friendService) {
    this.friendService = friendService;
  }

  sendRequest = async (req, res) => {
    const data = await this.friendService.sendRequest(req.user.id, req.body.username);
    res.status(201).json(data);
  };

  listRequests = async (req, res) => {
    const data = await this.friendService.listRequests(req.user.id);
    res.status(200).json(data);
  };

  acceptRequest = async (req, res) => {
    const data = await this.friendService.acceptRequest(req.user.id, req.params.request_id);
    res.status(200).json(data);
  };

  declineRequest = async (req, res) => {
    const data = await this.friendService.declineRequest(req.user.id, req.params.request_id);
    res.status(200).json(data);
  };

  cancelRequest = async (req, res) => {
    const data = await this.friendService.cancelRequest(req.user.id, req.params.request_id);
    res.status(200).json(data);
  };

  listFriends = async (req, res) => {
    const data = await this.friendService.listFriends(req.user.id);
    res.status(200).json({ friends: data });
  };

  friendStats = async (req, res) => {
    const data = await this.friendService.getFriendStats(req.user.id, req.params.friend_user_id);
    res.status(200).json(data);
  };

  friendProfile = async (req, res) => {
    const data = await this.friendService.getFriendProfile(
      req.user.id,
      req.params.friend_user_id
    );
    res.status(200).json(data);
  };
}
