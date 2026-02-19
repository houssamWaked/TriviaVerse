/**
 * Current user service ("me").
 */
import AppError from '../utils/AppError.js';
import UserDTO from '../domain/dto/UserDTO.js';

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

    if (s?.status === 'completed') {
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
}
