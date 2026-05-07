import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PublicService {
  constructor(private readonly db: DatabaseService) {}

  async getHomeMetrics() {
    const [sessions, questions, quizzes] = await Promise.all([
      this.db.supabase.from('game_sessions').select('user_id'),
      this.db.supabase.from('quiz_questions').select('*', { count: 'exact', head: true }),
      this.db.supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    ]);

    if (sessions.error) this.throwDbError(sessions.error.message);
    if (questions.error) this.throwDbError(questions.error.message);
    if (quizzes.error) this.throwDbError(quizzes.error.message);

    const activePlayers = new Set(
      (sessions.data || [])
        .map((row: any) => row.user_id)
        .filter((id: string | null | undefined) => Boolean(id)),
    ).size;

    return {
      active_players: activePlayers,
      questions: questions.count || 0,
      quizzes_created: quizzes.count || 0,
      fun_level: 100,
    };
  }

  async getLeaderboard(period = 'all_time', mode = 'global') {
    let resolvedPeriod = period;
    let rows = await this.listLeaderboardRows(period, mode);

    if (period === 'weekly' && rows.length === 0) {
      resolvedPeriod = 'all_time';
      rows = await this.listLeaderboardRows(resolvedPeriod, mode);
    }

    const userIds = Array.from(new Set(rows.map((row: any) => row.user_id).filter(Boolean)));
    const [users, stats] = await Promise.all([
      this.listUsers(userIds),
      this.listUserStats(userIds),
    ]);

    const userMap = new Map(users.map((user: any) => [user.id, user]));
    const statsMap = new Map(stats.map((stat: any) => [stat.user_id, stat]));

    return {
      period,
      mode,
      period_resolved: resolvedPeriod,
      entries: rows.map((row: any) => {
        const user = userMap.get(row.user_id);
        const stat = statsMap.get(row.user_id);
        return {
          rank_position: row.rank_position ?? null,
          user_id: row.user_id,
          username: user?.username ?? null,
          avatar_url: user?.avatar_url ?? null,
          level: stat?.level ?? 1,
          score_value: Number(row.score_value || 0),
        };
      }),
    };
  }

  private async listLeaderboardRows(period: string, mode: string) {
    const { data, error } = await this.db.supabase
      .from('leaderboard_entries')
      .select('rank_position, user_id, score_value, period, mode')
      .eq('period', period)
      .eq('mode', mode)
      .order('rank_position', { ascending: true, nullsFirst: false })
      .order('score_value', { ascending: false })
      .limit(50);

    if (error) this.throwDbError(error.message);
    return data || [];
  }

  private async listUsers(userIds: string[]) {
    if (userIds.length === 0) return [];
    const { data, error } = await this.db.supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (error) this.throwDbError(error.message);
    return data || [];
  }

  private async listUserStats(userIds: string[]) {
    if (userIds.length === 0) return [];
    const { data, error } = await this.db.supabase
      .from('user_stats')
      .select('user_id, level')
      .in('user_id', userIds);

    if (error) this.throwDbError(error.message);
    return data || [];
  }

  private throwDbError(message: string) {
    throw new InternalServerErrorException(message || 'Database error');
  }
}
