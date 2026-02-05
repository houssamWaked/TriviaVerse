/**
 * Blitz mode controller.
 */
export class BlitzController {
  constructor(sessionStartService) {
    this.sessionStartService = sessionStartService;
  }

  config = async (req, res) => {
    res.status(200).json({
      time_limit_sec: 60,
      rules: '60 seconds, no penalty',
    });
  };

  start = async (req, res) => {
    const data = await this.sessionStartService.startBlitzSession(req.user.id, req.body);
    res.status(201).json(data);
  };
}

