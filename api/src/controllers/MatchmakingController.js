/**
 * Matchmaking controller (async duels).
 */
export class MatchmakingController {
  constructor(blitzMatchmakingService) {
    this.blitzMatchmakingService = blitzMatchmakingService;
  }

  findBlitz = async (req, res) => {
    const data = await this.blitzMatchmakingService.findOrQueue(req.user.id, req.body);
    res.status(200).json(data);
  };

  blitzStatus = async (req, res) => {
    const data = await this.blitzMatchmakingService.getStatus(req.user.id, req.params.request_id);
    res.status(200).json(data);
  };

  cancelBlitz = async (req, res) => {
    const data = await this.blitzMatchmakingService.cancel(req.user.id, req.params.request_id);
    res.status(200).json(data);
  };
}
