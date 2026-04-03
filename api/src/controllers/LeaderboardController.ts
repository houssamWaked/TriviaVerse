/**
 * Leaderboard controller.
 */
import type { Request, Response } from 'express';

type LeaderboardParams = {
  period: string;
  mode: string;
};

type LeaderboardServiceLike = {
  getLeaderboard(params: LeaderboardParams): Promise<unknown>;
};

const getQueryValue = (value: string | string[] | undefined, fallback: string): string => {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
};

export class LeaderboardController {
  leaderboardService: LeaderboardServiceLike;

  constructor(leaderboardService: LeaderboardServiceLike) {
    this.leaderboardService = leaderboardService;
  }

  get = async (req: Request, res: Response) => {
    const data = await this.leaderboardService.getLeaderboard({
      period: getQueryValue(req.query.period as string | string[] | undefined, 'all_time'),
      mode: getQueryValue(req.query.mode as string | string[] | undefined, 'global'),
    });
    res.status(200).json(data);
  };
}
