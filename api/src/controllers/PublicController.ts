/**
 * Public controller.
 */
import type { Request, Response } from 'express';

type PublicServiceLike = {
  getHomeMetrics(): Promise<unknown>;
};

export class PublicController {
  publicService: PublicServiceLike;

  constructor(publicService: PublicServiceLike) {
    this.publicService = publicService;
  }

  homeMetrics = async (_req: Request, res: Response) => {
    const data = await this.publicService.getHomeMetrics();
    res.status(200).json(data);
  };
}
