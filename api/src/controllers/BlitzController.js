/**
 * Blitz mode controller.
 */
export class BlitzController {
  constructor(sessionStartService) {
    this.sessionStartService = sessionStartService;
  }

  config = async (req, res) => {
    res.status(200).json({
      time_limit_sec: 15,
      strikes: 3,
      rules: '15 seconds per question. Wrong or time-out = strike. 3 strikes = lose.',
    });
  };

  start = async (req, res) => {
    const data = await this.sessionStartService.startBlitzSession(req.user?.id || null, req.body);
    res.status(201).json(data);
  };
}
