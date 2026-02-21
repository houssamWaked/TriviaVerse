/**
 * Current user service ("me").
 */
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';
import { supabase } from '../config/supabase.js';
import { sessionCache } from '../utils/sessionCache.js';

function isoMax(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta)) return b;
  if (!Number.isFinite(tb)) return a;
  return tb > ta ? b : a;
}

function buildModeSummary(sessions = []) {
  const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'];
  const byMode = Object.fromEntries(
    modes.map((m) => [m, { mode: m, played: 0, completed: 0, best_score: 0, last_played_at: null }])
  );

  for (const s of sessions || []) {
    const mode = s?.mode;
    if (!mode || !byMode[mode]) continue;
    byMode[mode].played += 1;

    const endedAt = s?.ended_at || s?.started_at || null;
    byMode[mode].last_played_at = isoMax(byMode[mode].last_played_at, endedAt);

    const status = s?.status;
    const finished =
      status === 'completed' ||
      (mode === 'blitz' && status === 'abandoned') ||
      (mode === 'millionaire' && status === 'abandoned');

    if (finished) {
      byMode[mode].completed += 1;
      byMode[mode].best_score = Math.max(byMode[mode].best_score, Number(s?.score_total) || 0);
    }
  }

  const all = modes.reduce(
    (acc, m) => {
      acc.played += byMode[m].played;
      acc.completed += byMode[m].completed;
      acc.last_played_at = isoMax(acc.last_played_at, byMode[m].last_played_at);
      return acc;
    },
    { mode: 'all', played: 0, completed: 0, last_played_at: null }
  );

  return { all, by_mode: byMode };
}

export class MeService {
  constructor({
    userRepository,
    userStatsRepository,
    gameSessionRepository,
    storyService,
    quizScoreRepository,
    quizRepository,
  }) {
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.storyService = storyService;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRepository = quizRepository;
  }

  async getProfile(userId) {
    const [userEntity, stats, sessions] = await Promise.all([
      this.userRepository.findById(userId),
      this.userStatsRepository.findByUserId(userId),
      this.gameSessionRepository.listByUserId(userId, 500),
    ]);
    if (!userEntity) throw new AppError('User not found', 404, 'NOT_FOUND');

    const mode_summary = buildModeSummary(sessions);

    let story_progress = null;
    try {
      story_progress = await this.storyService.getUserProgress(userId);
    } catch (err) {
      // Story progress is optional for the profile page; gameplay can still work without it.
      story_progress = null;
    }

    let custom_quiz_best = [];
    try {
      const scoreRows = await this.quizScoreRepository.listByUserId(userId, 100);
      const quizIds = (scoreRows || []).map((r) => r.quiz_id).filter(Boolean);
      const quizzes = await this.quizRepository.findByIds(quizIds);
      const quizMap = new Map(quizzes.map((q) => [q.id, q]));

      custom_quiz_best = (scoreRows || [])
        .map((r) => {
          const q = quizMap.get(r.quiz_id);
          return {
            quiz_id: r.quiz_id,
            title: q?.title ?? null,
            best_score: r.best_score ?? 0,
            updated_at: r.updated_at ?? null,
          };
        })
        .filter((x) => !!x.title)
        .slice(0, 50);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') {
        custom_quiz_best = [];
      } else {
        throw err;
      }
    }

    return {
      user: UserDTO.fromEntity(userEntity),
      user_stats: stats,
      mode_summary,
      story_progress,
      custom_quiz_best,
    };
  }

  async resetProgress(userId) {
    const uid = String(userId || '').trim();
    if (!uid) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const userEntity = await this.userRepository.findById(uid);
    if (!userEntity) throw new AppError('User not found', 404, 'NOT_FOUND');

    const warnings = [];
    const missingTables = new Set();
    const ignoreTableMissing = (err) => {
      const code = String(err?.code || err?.details?.code || '').trim();
      return code === '42P01';
    };

    const safe = async (op, { table = null } = {}) => {
      try {
        return await op();
      } catch (err) {
        if (ignoreTableMissing(err)) {
          if (table && !missingTables.has(table)) {
            missingTables.add(table);
            warnings.push({
              code: 'NOT_CONFIGURED',
              message: `Table not configured: ${table}`,
            });
          }
          return null;
        }
        throw err;
      }
    };

    // Best-effort: drop any in-memory cached sessions for this user.
    sessionCache.delByUserId(uid);

    // Cancel any active matchmaking request (async duels).
    await safe(
      async () => {
        const { error } = await supabase
          .from('blitz_matchmaking_queue')
          .delete()
          .eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'blitz_matchmaking_queue' }
    );

    // Clear persistent progress tables.
    await safe(
      async () => {
        const { error } = await supabase.from('leaderboard_entries').delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'leaderboard_entries' }
    );

    await safe(
      async () => {
        const { error } = await supabase.from('quiz_scores').delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'quiz_scores' }
    );

    await safe(
      async () => {
        const { error } = await supabase.from('quiz_ratings').delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'quiz_ratings' }
    );

    await safe(
      async () => {
        const { error } = await supabase.from('user_story_progress').delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'user_story_progress' }
    );

    await safe(
      async () => {
        const { error } = await supabase.from('user_classic_progress').delete().eq('user_id', uid);
        if (error) throw error;
        return true;
      },
      { table: 'user_classic_progress' }
    );

    // Clear session history (and dependent rows) so totals/best scores reset.
    const sessions = await this.gameSessionRepository.listByUserId(uid, 1000);
    const sessionIds = Array.from(new Set((sessions || []).map((s) => s?.id).filter(Boolean)));

    // Duels store answers that reference session_options rows via FK.
    // Deleting duel-linked sessions would violate FK constraints and can affect other players,
    // so we preserve any sessions referenced by duels involving this user.
    const duelSessionIds = new Set();
    await safe(
      async () => {
        const pageSize = 1000;
        for (let offset = 0; offset < 50_000; offset += pageSize) {
          const { data, error } = await supabase
            .from('duels')
            .select('challenger_session_id,opponent_session_id')
            .or(`challenger_user_id.eq.${uid},opponent_user_id.eq.${uid}`)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);
          if (error) throw error;

          for (const d of data || []) {
            if (d?.challenger_session_id) duelSessionIds.add(d.challenger_session_id);
            if (d?.opponent_session_id) duelSessionIds.add(d.opponent_session_id);
          }

          if (!data || data.length < pageSize) break;
        }
        return true;
      },
      { table: 'duels' }
    );

    const deletableSessionIds =
      duelSessionIds.size > 0
        ? sessionIds.filter((id) => !duelSessionIds.has(id))
        : sessionIds;

    if (deletableSessionIds.length !== sessionIds.length) {
      warnings.push({
        code: 'DUEL_SESSIONS_PRESERVED',
        message:
          'Some duel-related sessions were preserved during reset to avoid affecting other players.',
      });
    }

    const chunk = (arr, size = 200) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    // session_lifelines keyed by session_id
    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(
        async () => {
          const { error } = await supabase.from('session_lifelines').delete().in('session_id', ids);
          if (error) throw error;
          return true;
        },
        { table: 'session_lifelines' }
      );
    }

    // session_questions -> (session_options, session_answers) keyed by session_question_id
    const sessionQuestionIds = [];
    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(
        async () => {
          const { data, error } = await supabase
            .from('session_questions')
            .select('id')
            .in('session_id', ids);
          if (error) throw error;
          for (const r of data || []) if (r?.id) sessionQuestionIds.push(r.id);
          return true;
        },
        { table: 'session_questions' }
      );
    }

    for (const sqIds of chunk(sessionQuestionIds, 200)) {
      await safe(
        async () => {
          const { error } = await supabase
            .from('session_answers')
            .delete()
            .in('session_question_id', sqIds);
          if (error) throw error;
          return true;
        },
        { table: 'session_answers' }
      );
      await safe(
        async () => {
          const { error } = await supabase
            .from('session_options')
            .delete()
            .in('session_question_id', sqIds);
          if (error) throw error;
          return true;
        },
        { table: 'session_options' }
      );
    }

    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(
        async () => {
          const { error } = await supabase.from('session_questions').delete().in('session_id', ids);
          if (error) throw error;
          return true;
        },
        { table: 'session_questions' }
      );

      // Optional meta tables (should cascade in most schemas).
      await safe(
        async () => {
          const { error } = await supabase.from('story_sessions').delete().in('session_id', ids);
          if (error) throw error;
          return true;
        },
        { table: 'story_sessions' }
      );
      await safe(
        async () => {
          const { error } = await supabase.from('classic_sessions').delete().in('session_id', ids);
          if (error) throw error;
          return true;
        },
        { table: 'classic_sessions' }
      );
    }

    for (const ids of chunk(deletableSessionIds, 200)) {
      await safe(
        async () => {
          const { error } = await supabase.from('game_sessions').delete().in('id', ids);
          if (error) throw error;
          return true;
        },
        { table: 'game_sessions' }
      );
    }

    // Reset numeric stats (XP/level/streak).
    await this.userStatsRepository.resetProgress(uid);

    return {
      success: true,
      user_id: uid,
      warnings,
    };
  }
}
