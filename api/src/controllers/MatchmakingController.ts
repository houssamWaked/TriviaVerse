/**
 * Matchmaking controller (async duels).
 */
import type { Request, Response } from 'express';

type BlitzMatchmakingServiceLike = {
  findOrQueue(userId: string, body: unknown): Promise<unknown>;
  getStatus(userId: string, requestId: string): Promise<unknown>;
  cancel(userId: string, requestId: string): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export class MatchmakingController {
  blitzMatchmakingService: BlitzMatchmakingServiceLike;

  constructor(blitzMatchmakingService: BlitzMatchmakingServiceLike) {
    this.blitzMatchmakingService = blitzMatchmakingService;
  }

  findBlitz = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.findOrQueue(req.user!.id, req.body);
    res.status(200).json(data);
  };

  blitzStatus = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.getStatus(
      req.user!.id,
      getParam(req.params.request_id)
    );
    res.status(200).json(data);
  };

  cancelBlitz = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.cancel(
      req.user!.id,
      getParam(req.params.request_id)
    );
    res.status(200).json(data);
  };
}
