/**
 * Classic mode controller.
 */
export class ClassicController {
  constructor(sessionStartService) {
    this.sessionStartService = sessionStartService;
  }

  start = async (req, res) => {
    const data = await this.sessionStartService.startClassicSession(req.user.id, req.body);
    res.status(201).json(data);
  };
}

