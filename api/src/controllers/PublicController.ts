/**
 * Public controller.
 */
import type { Request, Response } from 'express';

type PublicServiceLike = {
  getHomeMetrics(): Promise<unknown>;
};

// HTTP adapter for unauthenticated "public" endpoints.
export class PublicController {
  publicService: PublicServiceLike;

  /**
   * Construct a controller that delegates to the public service.
   * @param publicService Service providing read-only public data.
   * @returns A `PublicController` instance.
   */
  constructor(publicService: PublicServiceLike) {
    this.publicService = publicService;
  }

  /**
   * Fetch lightweight metrics for the home page (counts, etc.).
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with aggregated metrics.
   */
  homeMetrics = async (_req: Request, res: Response) => {
    const data = await this.publicService.getHomeMetrics();
    res.status(200).json(data);
  };
}
