/**
 * Public controller.
 */
export class PublicController {
  constructor(publicService) {
    this.publicService = publicService;
  }

  homeMetrics = async (req, res) => {
    const data = await this.publicService.getHomeMetrics();
    res.status(200).json(data);
  };
}
