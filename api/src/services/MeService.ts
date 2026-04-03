/**
 * Current user service ("me").
 */
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';
import { supabase } from '../config/supabase.js';
import { sessionCache } from '../utils/sessionCache.js';

type ErrorWithCode = { code?: string; details?: { code?: string } };

type UserLike = {
  id: string;
};

type UserRepositoryLike = {
  findById(userId: string): Promise<UserLike | null>;
};

type UserStatsRepositoryLike = {
  findByUserId(userId: string): Promise<unknown>;
  resetProgress(userId: string): Promise<unknown>;
};

type GameSessionLike = {
  id?: string;
  mode?: string;
  started_at?: string | null;
  ended_at?: string | null;
  score_total?: number | null;
  status?: string | null;
};

type GameSessionRepositoryLike = {
  listByUserId(userId: string, limit?: number): Promise<GameSessionLike[]>;
};

type StoryServiceLike = {
  getUserProgress(userId: string): Promise<unknown>;
};

type QuizScoreRowLike = {
  quiz_id: string;
  best_score?: number | null;
  updated_at?: string | null;
};

type QuizScoreRepositoryLike = {
  listByUserId(userId: string, limit?: number): Promise<QuizScoreRowLike[]>;
};

type QuizLike = {
  id: string;
  title?: string | null;
};

type QuizRepositoryLike = {
  findByIds(quizIds: string[]): Promise<QuizLike[]>;
};

function isoMax(a: string | null, b: string | null): string | null {
  if (!a) return b || null;
  if (!b) return a || null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta)) return b;
  if (!Number.isFinite(tb)) return a;
  return tb > ta ? b : a;
}

function buildModeSummary(sessions: GameSessionLike[] = []) {
  const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'] as const;
  const byMode = Object.fromEntries(
    modes.map((mode) => [mode, { mode, played: 0, completed: 0, best_score: 0, last_played_at: null as string | null }])
  ) as Record<(typeof modes)[number], { mode: string; played: number; completed: number; best_score: number; last_played_at: string | null }>;

  for (const session of sessions) {
    const mode = session?.mode as keyof typeof byMode | undefined;
    if (!mode || !byMode[mode]) continue;
    byMode[mode].played += 1;
    const endedAt = session?.ended_at || session?.started_at || null;
    byMode[mode].last_played_at = isoMax(byMode[mode].last_played_at, endedAt);
    const status = session?.status;
    const finished =
      status === 'completed' ||
      (mode === 'blitz' && status === 'abandoned') ||
      (mode === 'millionaire' && status === 'abandoned');
    if (finished) {
      byMode[mode].completed += 1;
      byMode[mode].best_score = Math.max(byMode[mode].best_score, Number(session?.score_total) || 0);
    }
  }

  const all = modes.reduce(
    (acc, mode) => {
      acc.played += byMode[mode].played;
      acc.completed += byMode[mode].completed;
      acc.last_played_at = isoMax(acc.last_played_at, byMode[mode].last_played_at);
      return acc;
    },
    { mode: 'all', played: 0, completed: 0, last_played_at: null as string | null }
  );

  return { all, by_mode: byMode };
}

export class MeService {
  userRepository: UserRepositoryLike;
  userStatsRepository: UserStatsRepositoryLike;
  gameSessionRepository: GameSessionRepositoryLike;
  storyService: StoryServiceLike;
  quizScoreRepository: QuizScoreRepositoryLike;
  quizRepository: QuizRepositoryLike;

  constructor({
    userRepository,
    userStatsRepository,
    gameSessionRepository,
    storyService,
    quizScoreRepository,
    quizRepository,
  }: {
    userRepository: UserRepositoryLike;
    userStatsRepository: UserStatsRepositoryLike;
    gameSessionRepository: GameSessionRepositoryLike;
    storyService: StoryServiceLike;
    quizScoreRepository: QuizScoreRepositoryLike;
    quizRepository: QuizRepositoryLike;
  }) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.storyService = storyService;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRepository = quizRepository;
  }

  async getProfile(userId: string) {
    const [userEntity, stats, sessions] = await Promise.all([
      this.userRepository.findById(userId),
      this.userStatsRepository.findByUserId(userId),
      this.gameSessionRepository.listByUserId(userId, 500),
    ]);
    if (!userEntity) throw new AppError('User not found', 404, 'NOT_FOUND');

    const mode_summary = buildModeSummary(sessions);
    let story_progress: unknown = null;
    try {
      story_progress = await this.storyService.getUserProgress(userId);
    } catch {
      story_progress = null;
    }

    let custom_quiz_best: Array<{ quiz_id: string; title: string | null; best_score: number; updated_at: string | null }> = [];
    try {
      const scoreRows = await this.quizScoreRepository.listByUserId(userId, 100);
      const quizIds = scoreRows.map((row) => row.quiz_id).filter(Boolean);
      const quizzes = await this.quizRepository.findByIds(quizIds);
      const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

      custom_quiz_best = scoreRows
        .map((row) => {
          const quiz = quizMap.get(row.quiz_id);
          return {
            quiz_id: row.quiz_id,
            title: quiz?.title ?? null,
            best_score: row.best_score ?? 0,
            updated_at: row.updated_at ?? null,
          };
        })
        .filter((item) => Boolean(item.title))
        .slice(0, 50);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') {
        custom_quiz_best = [];
      } else {
        throw err;
      }
    }

    return {
      user: UserDTO.fromEntity(userEntity as any),
      user_stats: stats,
      mode_summary,
      story_progress,
      custom_quiz_best,
    };
  }

  async resetProgress(userId: string) {
    const uid = String(userId || '').trim();
    if (!uid) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const userEntity = await this.userRepository.findById(uid);
    if (!userEntity) throw new AppError('User not found', 404, 'NOT_FOUND');

    const warnings: Array<{ code: string; message: string }> = [];
    const missingTables = new Set<string>();
    const ignoreTableMissing = (err: unknown) => {
      const code = String((err as ErrorWithCode)?.code || (err as ErrorWithCode)?.details?.code || '').trim();
      return code === '42P01';
    };

    const safe = async <T>(op: () => Promise<T>, { table = null as string | null } = {}): Promise<T | null> => {
      try {
        return await op();
      } catch (err) {
        if (ignoreTableMissing(err)) {
          if (table && !missingTables.has(table)) {
            missingTables.add(table);
            warnings.push({ code: 'NOT_CONFIGURED', message: `Table not configured: ${table}` });
          }
          return null;
        }
        throw err;
      }
    };

    sessionCache.delByUserId(uid);

    await safe(async () => {
      const { error } = await supabase.from('blitz_matchmaking_queue').delete().eq('user_id', uid);
      if (error) throw error;
      return true;
    }, { table: 'blitz_matchmaking_queue' });

    for (const table of ['leaderboard_entries', 'quiz_scores', 'quiz_ratings', 'user_story_progress', 'user_classic_progress']) {
      await safe(async () => {
        const { error } = await supabase.from(table).delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      }, { table });
    }

    const sessions = await this.gameSessionRepository.listByUserId(uid, 1000);
    const sessionIds = Array.from(new Set(sessions.map((session) => session?.id).filter((id): id is string => Boolean(id))));
    const duelSessionIds = new Set<string>();

    await safe(async () => {
      const pageSize = 1000;
      for (let offset = 0; offset < 50_000; offset += pageSize) {
        const { data, error } = await supabase
          .from('duels')
          .select('challenger_session_id,opponent_session_id')
          .or(`challenger_user_id.eq.${uid},opponent_user_id.eq.${uid}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        for (const duel of data || []) {
          const row = duel as { challenger_session_id?: string | null; opponent_session_id?: string | null };
          if (row.challenger_session_id) duelSessionIds.add(row.challenger_session_id);
          if (row.opponent_session_id) duelSessionIds.add(row.opponent_session_id);
        }
        if (!data || data.length < pageSize) break;
      }
      return true;
    }, { table: 'duels' });

    const deletableSessionIds = duelSessionIds.size > 0 ? sessionIds.filter((id) => !duelSessionIds.has(id)) : sessionIds;
    if (deletableSessionIds.length !== sessionIds.length) {
      warnings.push({
        code: 'DUEL_SESSIONS_PRESERVED',
        message: 'Some duel-related sessions were preserved during reset to avoid affecting other players.',
      });
    }

    const chunk = <T>(arr: T[], size = 200): T[][] => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(async () => {
        const { error } = await supabase.from('session_lifelines').delete().in('session_id', ids);
        if (error) throw error;
        return true;
      }, { table: 'session_lifelines' });
    }

    const sessionQuestionIds: string[] = [];
    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(async () => {
        const { data, error } = await supabase.from('session_questions').select('id').in('session_id', ids);
        if (error) throw error;
        for (const row of data || []) {
          const id = (row as { id?: string }).id;
          if (id) sessionQuestionIds.push(id);
        }
        return true;
      }, { table: 'session_questions' });
    }

    for (const sqIds of chunk(sessionQuestionIds, 200)) {
      await safe(async () => {
        const { error } = await supabase.from('session_answers').delete().in('session_question_id', sqIds);
        if (error) throw error;
        return true;
      }, { table: 'session_answers' });
      await safe(async () => {
        const { error } = await supabase.from('session_options').delete().in('session_question_id', sqIds);
        if (error) throw error;
        return true;
      }, { table: 'session_options' });
    }

    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(async () => {
        const { error } = await supabase.from('session_questions').delete().in('session_id', ids);
        if (error) throw error;
        return true;
      }, { table: 'session_questions' });
      await safe(async () => {
        const { error } = await supabase.from('story_sessions').delete().in('session_id', ids);
        if (error) throw error;
        return true;
      }, { table: 'story_sessions' });
      await safe(async () => {
        const { error } = await supabase.from('classic_sessions').delete().in('session_id', ids);
        if (error) throw error;
        return true;
      }, { table: 'classic_sessions' });
    }

    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(async () => {
        const { error } = await supabase.from('game_sessions').delete().in('id', ids);
        if (error) throw error;
        return true;
      }, { table: 'game_sessions' });
    }

    await this.userStatsRepository.resetProgress(uid);
    return { success: true, user_id: uid, warnings };
  }
}
