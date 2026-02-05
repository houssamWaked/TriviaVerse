/**
 * Shared session gameplay controller.
 */
export class SessionsController {
  constructor(sessionService) {
    this.sessionService = sessionService;
  }

  current = async (req, res) => {
    const data = await this.sessionService.getCurrent(req.params.session_id, req.user.id);
    res.status(200).json(data);
  };

  answer = async (req, res) => {
    const data = await this.sessionService.submitAnswer(
      req.params.session_id,
      req.user.id,
      req.body
    );
    res.status(200).json(data);
  };

  useLifeline = async (req, res) => {
    const data = await this.sessionService.useLifeline(
      req.params.session_id,
      req.user.id,
      req.body
    );
    res.status(200).json(data);
  };

  finish = async (req, res) => {
    const data = await this.sessionService.finish(
      req.params.session_id,
      req.user.id,
      req.body.status
    );
    res.status(200).json(data);
  };
}

