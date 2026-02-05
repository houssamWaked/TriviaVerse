/**
 * Millionaire mode controller.
 */
export class MillionaireController {
  constructor(millionaireLadderRepository, sessionStartService) {
    this.millionaireLadderRepository = millionaireLadderRepository;
    this.sessionStartService = sessionStartService;
  }

  config = async (req, res) => {
    const ladders = await this.millionaireLadderRepository.listAll();
    res.status(200).json({ ladders });
  };

  start = async (req, res) => {
    const data = await this.sessionStartService.startMillionaireSession(
      req.user.id,
      req.body.ladder_id
    );
    res.status(201).json(data);
  };
}

