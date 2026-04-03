/**
 * Current user controller ("me").
 */
import type { Request, Response } from 'express';

type MeServiceLike = {
  getProfile(userId: string): Promise<unknown>;
  resetProgress(userId: string): Promise<unknown>;
};

export class MeController {
  meService: MeServiceLike;

  constructor(meService: MeServiceLike) {
    this.meService = meService;
  }

  profile = async (req: Request, res: Response) => {
    const data = await this.meService.getProfile(req.user!.id);
    res.status(200).json(data);
  };

  resetProgress = async (req: Request, res: Response) => {
    const data = await this.meService.resetProgress(req.user!.id);
    res.status(200).json(data);
  };
}
