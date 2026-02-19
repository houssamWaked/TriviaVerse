/**
 * Duel controller.
 */
export class DuelController {
  constructor(duelService) {
    this.duelService = duelService;
  }

  listMine = async (req, res) => {
    const data = await this.duelService.listMyDuels(req.user.id);
    res.status(200).json({ entries: data });
  };

  create = async (req, res) => {
    const data = await this.duelService.createChallenge(req.user.id, req.body);
    res.status(201).json(data);
  };

  accept = async (req, res) => {
    const data = await this.duelService.acceptChallenge(req.user.id, req.params.duel_id);
    res.status(200).json(data);
  };

  decline = async (req, res) => {
    const data = await this.duelService.declineChallenge(req.user.id, req.params.duel_id);
    res.status(200).json(data);
  };

  cancel = async (req, res) => {
    const data = await this.duelService.cancelChallenge(req.user.id, req.params.duel_id);
    res.status(200).json(data);
  };

  liveState = async (req, res) => {
    const data = await this.duelService.getLiveState(req.user.id, req.params.duel_id);
    res.status(200).json(data);
  };

  liveAnswer = async (req, res) => {
    const data = await this.duelService.submitLiveAnswer(req.user.id, req.params.duel_id, req.body);
    res.status(200).json(data);
  };
}
