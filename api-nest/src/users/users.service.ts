import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthTokenService } from '../auth/auth-token.service';
import { DatabaseService } from '../database/database.service';

const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'];

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokens: AuthTokenService,
  ) {}

  async getMyProfile(req: any) {
    const authUser = this.tokens.requireUserFromRequest(req);
    const userId = authUser.id;
    const [user, stats, sessions, customBest, story] = await Promise.all([
      this.getUser(userId),
      this.getStats(userId),
      this.getSessions(userId),
      this.getCustomQuizBest(userId),
      this.getStoryProgress(userId),
    ]);

    return {
      user,
      user_stats: stats,
      mode_summary: { entries: this.buildModeEntries(sessions) },
      story_progress: story,
      custom_quiz_best: customBest,
    };
  }

  private async getUser(userId: string) {
    const { data, error } = await this.db.supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', userId)
      .limit(1);

    if (error || !data?.[0]) throw new NotFoundException('User not found');
    const user = data[0] as any;
    return {
      id: String(user.id),
      username: String(user.username || ''),
      email: String(user.email || ''),
      avatar_url: user.avatar_url ?? null,
    };
  }

  private async getStats(userId: string) {
    const { data, error } = await this.db.supabase
      .from('user_stats')
      .select('level, xp_total, streak_days')
      .eq('user_id', userId)
      .limit(1);

    if (error || !data?.[0]) return { level: 1, xp_total: 0, streak_days: 0 };
    const stats = data[0] as any;
    return {
      level: Number(stats.level || 1),
      xp_total: Number(stats.xp_total || 0),
      streak_days: Number(stats.streak_days || 0),
    };
  }

  private async getSessions(userId: string) {
    const { data, error } = await this.db.supabase
      .from('game_sessions')
      .select('mode, started_at, ended_at, score_total, status')
      .eq('user_id', userId)
      .limit(500);

    if (error) return [];
    return data || [];
  }

  private async getCustomQuizBest(userId: string) {
    const { data: scores, error } = await this.db.supabase
      .from('quiz_scores')
      .select('quiz_id, best_score, updated_at')
      .eq('user_id', userId)
      .order('best_score', { ascending: false })
      .limit(50);

    if (error || !scores?.length) return [];
    const quizIds = scores.map((score: any) => score.quiz_id).filter(Boolean);
    const { data: quizzes } = await this.db.supabase
      .from('quizzes')
      .select('id, title')
      .in('id', quizIds);

    const quizMap = new Map((quizzes || []).map((quiz: any) => [quiz.id, quiz]));
    return scores
      .map((score: any) => ({
        quiz_id: score.quiz_id,
        title: quizMap.get(score.quiz_id)?.title ?? null,
        best_score: Number(score.best_score || 0),
        updated_at: score.updated_at ?? null,
      }))
      .filter((entry) => Boolean(entry.title));
  }

  private async getStoryProgress(userId: string) {
    const { count: totalLevels } = await this.db.supabase
      .from('story_levels')
      .select('*', { count: 'exact', head: true });
    const { count: completedLevels } = await this.db.supabase
      .from('user_story_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    return {
      completed_levels: completedLevels || 0,
      total_levels: totalLevels || 0,
    };
  }

  private buildModeEntries(sessions: any[]) {
    return modes.map((mode) => {
      const modeSessions = sessions.filter((session) => session.mode === mode);
      const completed = modeSessions.filter((session) => {
        const status = String(session.status || '');
        return status === 'completed' || status === 'abandoned';
      });
      return {
        mode,
        played: modeSessions.length,
        completed: completed.length,
        best_score: completed.reduce(
          (best, session) => Math.max(best, Number(session.score_total || 0)),
          0,
        ),
        last_played_at: this.latestDate(modeSessions),
      };
    });
  }

  private latestDate(rows: any[]) {
    let latest: string | null = null;
    for (const row of rows) {
      const next = row.ended_at || row.started_at || null;
      if (!next) continue;
      if (!latest || new Date(next).getTime() > new Date(latest).getTime()) latest = next;
    }
    return latest;
  }
}
