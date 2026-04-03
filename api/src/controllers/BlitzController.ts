/**
 * Blitz mode controller.
 */
import type { Request, Response } from 'express';

type SessionStartServiceLike = {
  startBlitzSession(userId: string | null, body: unknown): Promise<unknown>;
};

export class BlitzController {
  sessionStartService: SessionStartServiceLike;

  constructor(sessionStartService: SessionStartServiceLike) {
    this.sessionStartService = sessionStartService;
  }

  config = async (_req: Request, res: Response) => {
    res.status(200).json({
      time_limit_sec: 15,
      strikes: 1,
      rules: '15 seconds per question. Wrong or time-out ends the run. Longest streak wins.',
    });
  };

  start = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startBlitzSession(req.user?.id || null, req.body);
    res.status(201).json(data);
  };
}
