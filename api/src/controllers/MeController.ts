/**
 * Current user controller ("me").
 */
import type { Request, Response } from 'express';

type MeServiceLike = {
  getProfile(userId: string): Promise<unknown>;
  resetProgress(userId: string): Promise<unknown>;
};

// HTTP adapter for "me" endpoints (current user's profile and self-service actions).
export class MeController {
  meService: MeServiceLike;

  /**
   * Construct a controller that delegates to the current-user service.
   * @param meService Service implementing current-user operations.
   * @returns A `MeController` instance.
   */
  constructor(meService: MeServiceLike) {
    this.meService = meService;
  }

  /**
   * Fetch the authenticated user's profile.
   * @param req Express request (requires `req.user`).
   * @param res Express response.
   * @returns A 200 response with profile data.
   */
  profile = async (req: Request, res: Response) => {
    const data = await this.meService.getProfile(req.user!.id);
    res.status(200).json(data);
  };

  /**
   * Reset progress for the authenticated user (best-effort cleanup).
   * @param req Express request (requires `req.user`).
   * @param res Express response.
   * @returns A 200 response indicating success and any warnings.
   */
  resetProgress = async (req: Request, res: Response) => {
    const data = await this.meService.resetProgress(req.user!.id);
    res.status(200).json(data);
  };
}
