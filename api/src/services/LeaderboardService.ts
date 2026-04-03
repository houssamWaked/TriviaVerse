/**
 * Leaderboard service.
 */
type LeaderboardRowLike = {
  rank_position?: number | null;
  user_id: string;
  score_value: number;
};

type LeaderboardRepositoryLike = {
  list(input: { period: string; mode: string }): Promise<LeaderboardRowLike[]>;
};

type UserLike = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type UserRepositoryLike = {
  findByIds(userIds: string[]): Promise<UserLike[]>;
};

type UserStatLike = {
  user_id: string;
  level: number | null;
};

type UserStatsRepositoryLike = {
  listByUserIds(userIds: string[]): Promise<UserStatLike[]>;
};

type GetLeaderboardInput = {
  period?: string;
  mode?: string;
};

export class LeaderboardService {
  leaderboardRepository: LeaderboardRepositoryLike;
  userRepository: UserRepositoryLike;
  userStatsRepository: UserStatsRepositoryLike;

  constructor(
    leaderboardRepository: LeaderboardRepositoryLike,
    userRepository: UserRepositoryLike,
    userStatsRepository: UserStatsRepositoryLike
  ) {
    this.leaderboardRepository = leaderboardRepository;
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
  }

  async getLeaderboard({ period = 'all_time', mode = 'global' }: GetLeaderboardInput = {}) {
    let resolvedPeriod = period;
    let rows = await this.leaderboardRepository.list({ period, mode });

    if (period === 'weekly' && rows.length === 0) {
      resolvedPeriod = 'all_time';
      rows = await this.leaderboardRepository.list({ period: resolvedPeriod, mode });
    }

    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    const [users, stats] = await Promise.all([
      this.userRepository.findByIds(userIds),
      this.userStatsRepository.listByUserIds(userIds),
    ]);

    const userMap = new Map(users.filter(Boolean).map((user) => [user.id, user]));
    const statsMap = new Map(stats.filter(Boolean).map((stat) => [stat.user_id, stat]));

    return {
      period,
      mode,
      period_resolved: resolvedPeriod,
      entries: rows.map((row) => {
        const user = userMap.get(row.user_id);
        const stat = statsMap.get(row.user_id);
        return {
          rank_position: row.rank_position ?? null,
          user_id: row.user_id,
          username: user?.username ?? null,
          avatar_url: user?.avatar_url ?? null,
          level: stat?.level ?? 1,
          score_value: row.score_value,
        };
      }),
    };
  }
}
