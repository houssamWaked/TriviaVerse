/**
 * Millionaire mode controller.
 */
export class MillionaireController {
  constructor(millionaireLadderRepository, sessionStartService) {
    this.millionaireLadderRepository = millionaireLadderRepository;
    this.sessionStartService = sessionStartService;
  }

  config = async (req, res) => {
    let ladders = [];
    try {
      ladders = await this.millionaireLadderRepository.listAll();
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
      ladders = [];
    }
    res.status(200).json({ ladders });
  };

  start = async (req, res) => {
    const data = await this.sessionStartService.startMillionaireSession(
      req.user.id,
      req.body.ladder_id || null
    );
    res.status(201).json(data);
  };
}
