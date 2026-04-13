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

// HTTP adapter for leaderboard endpoints (public read-only rankings).
export class LeaderboardController {
  leaderboardService: LeaderboardServiceLike;

  /**
   * Construct a controller that delegates to the leaderboard service.
   * @param leaderboardService Service that builds leaderboard responses.
   * @returns A `LeaderboardController` instance.
   */
  constructor(leaderboardService: LeaderboardServiceLike) {
    this.leaderboardService = leaderboardService;
  }

  /**
   * Fetch leaderboard entries for a period and mode.
   * @param req Express request (reads `period` and `mode` from query).
   * @param res Express response.
   * @returns A 200 response with leaderboard entries.
   */
  get = async (req: Request, res: Response) => {
    const data = await this.leaderboardService.getLeaderboard({
      period: getQueryValue(req.query.period as string | string[] | undefined, 'all_time'),
      mode: getQueryValue(req.query.mode as string | string[] | undefined, 'global'),
    });
    res.status(200).json(data);
  };
}
