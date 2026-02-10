/**
 * Shared session gameplay controller.
 */
export class SessionsController {
  constructor(sessionService) {
    this.sessionService = sessionService;
  }

  current = async (req, res) => {
    const data = await this.sessionService.getCurrent(req.params.session_id, req.user?.id || null);
    res.status(200).json(data);
  };

  review = async (req, res) => {
    const data = await this.sessionService.getReview(req.params.session_id, req.user?.id || null);
    res.status(200).json(data);
  };

  answer = async (req, res) => {
    const data = await this.sessionService.submitAnswer(
      req.params.session_id,
      req.user?.id || null,
      req.body
    );
    res.status(200).json(data);
  };

  useLifeline = async (req, res) => {
    const data = await this.sessionService.useLifeline(
      req.params.session_id,
      req.user?.id || null,
      req.body
    );
    res.status(200).json(data);
  };

  finish = async (req, res) => {
    const data = await this.sessionService.finish(
      req.params.session_id,
      req.user?.id || null,
      req.body.status
    );
    res.status(200).json(data);
  };
}
