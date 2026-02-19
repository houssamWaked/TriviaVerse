/**
 * Current user controller ("me").
 */
export class MeController {
  constructor(meService) {
    this.meService = meService;
  }

  profile = async (req, res) => {
    const data = await this.meService.getProfile(req.user.id);
    res.status(200).json(data);
  };
}
