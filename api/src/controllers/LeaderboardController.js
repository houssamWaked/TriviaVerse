/**
 * Leaderboard controller.
 */
export class LeaderboardController {
  constructor(leaderboardService) {
    this.leaderboardService = leaderboardService;
  }

  get = async (req, res) => {
    const data = await this.leaderboardService.getLeaderboard({
      period: req.query.period || 'all_time',
      mode: req.query.mode || 'global',
    });
    res.status(200).json(data);
  };
}
