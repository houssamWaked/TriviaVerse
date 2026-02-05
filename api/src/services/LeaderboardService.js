/**
 * Leaderboard service.
 */
export class LeaderboardService {
  constructor(leaderboardRepository, userRepository, userStatsRepository) {
    this.leaderboardRepository = leaderboardRepository;
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
  }

  async getLeaderboard({ period = 'all_time', mode = 'global' }) {
    const rows = await this.leaderboardRepository.list({ period, mode });
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

    const [users, stats] = await Promise.all([
      this.userRepository.findByIds(userIds),
      this.userStatsRepository.listByUserIds(userIds),
    ]);

    const userMap = new Map(users.filter(Boolean).map((u) => [u.id, u]));
    const statsMap = new Map(stats.filter(Boolean).map((s) => [s.user_id, s]));

    return {
      period,
      mode,
      entries: rows.map((r) => {
        const user = userMap.get(r.user_id);
        const stat = statsMap.get(r.user_id);
        return {
          rank_position: r.rank_position,
          user_id: r.user_id,
          username: user?.username ?? null,
          avatar_url: user?.avatar_url ?? null,
          level: stat?.level ?? 1,
          score_value: r.score_value,
        };
      }),
    };
  }
}
