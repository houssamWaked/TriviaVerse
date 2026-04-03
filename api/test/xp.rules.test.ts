import test from 'node:test';
import assert from 'node:assert/strict';

import { SessionService } from '../src/services/SessionService.js';

function createServiceHarness({
  session,
  updated = { ...session, status: 'completed', score_total: 250 },
  storyMeta = null,
  storyLevel = null,
  storyQuestions = [],
  storyAnswers = [],
  storyExistingProgress = null,
  ratingsRows = [],
}: {
  session: any;
  updated?: any;
  storyMeta?: any;
  storyLevel?: any;
  storyQuestions?: any[];
  storyAnswers?: any[];
  storyExistingProgress?: any;
  ratingsRows?: any[];
}) {
  const calls = {
    addXp: [],
  };

  const gameSessionRepository = {
    findById: async () => session,
    updateStatus: async () => updated,
  };

  const sessionQuestionRepository = {
    listBySessionId: async () => storyQuestions,
  };

  const sessionOptionRepository = {};
  const sessionAnswerRepository = {
    listBySessionQuestionIds: async () => storyAnswers,
  };
  const sessionLifelineRepository = {};

  const leaderboardRepository = {
    insertFromSession: async () => true,
  };

  const userStatsRepository = {
    addXp: async (userId, xpDelta) => {
      calls.addXp.push({ userId, xpDelta });
      return { user_id: userId, xp_total: xpDelta };
    },
  };

  const quizScoreRepository = {
    upsertBest: async () => true,
  };

  const quizRatingRepository = {
    listByQuizId: async () => ratingsRows,
  };

  const storySessionRepository = {
    findBySessionId: async () => storyMeta,
  };

  const storyLevelRepository = {
    findById: async () => storyLevel,
    findByLevelNumber: async () => null,
  };

  const userStoryProgressRepository = {
    findByUserAndLevelId: async () => storyExistingProgress,
    upsertResult: async () => true,
    ensureUnlocked: async () => true,
  };

  const svc = new SessionService({
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    sessionAnswerRepository,
    sessionLifelineRepository,
    leaderboardRepository,
    userStatsRepository,
    quizQuestionRepository: {},
    quizScoreRepository,
    quizRatingRepository,
    storyLevelRepository,
    userStoryProgressRepository,
    storySessionRepository,
    sessionStartService: {},
  });

  return { svc, calls };
}

test('XP: classic mode awards XP on completion', async () => {
  const session = {
    id: 's',
    user_id: 'u',
    mode: 'classic',
  };
  const updated = { ...session, status: 'completed', score_total: 420 };

  const { svc, calls } = createServiceHarness({ session, updated });
  await svc.finish('s', 'u', 'completed');

  assert.deepEqual(calls.addXp, [{ userId: 'u', xpDelta: 420 }]);
});

test('XP: blitz and millionaire award no XP', async () => {
  for (const mode of ['blitz', 'millionaire']) {
    const session = { id: 's', user_id: 'u', mode };
    const updated = { ...session, status: 'completed', score_total: 999 };
    const { svc, calls } = createServiceHarness({ session, updated });
    await svc.finish('s', 'u', 'completed');
    assert.equal(calls.addXp.length, 0);
  }
});

test('XP: story awards xp_reward when level is passed', async () => {
  const session = { id: 's', user_id: 'u', mode: 'story' };
  const storyMeta = { session_id: 's', level_id: 'lvl', level_number: 1 };
  const storyLevel = { id: 'lvl', pass_score_min: 10, xp_reward: 50 };
  const storyQuestions = [
    { id: 'q1', points_snapshot: 50 },
    { id: 'q2', points_snapshot: 50 },
  ];
  const storyAnswersPerfect = [
    { session_question_id: 'q1', is_correct: true },
    { session_question_id: 'q2', is_correct: true },
  ];
  const updated = { ...session, status: 'completed', score_total: 100 };

  const h1 = createServiceHarness({
    session,
    updated,
    storyMeta,
    storyLevel,
    storyQuestions,
    storyAnswers: storyAnswersPerfect,
    storyExistingProgress: { best_score: 0, is_completed: false, stars_earned: 0 },
  });
  await h1.svc.finish('s', 'u', 'completed');
  assert.deepEqual(h1.calls.addXp, [{ userId: 'u', xpDelta: 50 }]);
});

test('XP: story awards no XP when level is not passed', async () => {
  const session = { id: 's', user_id: 'u', mode: 'story' };
  const storyMeta = { session_id: 's', level_id: 'lvl', level_number: 1 };
  const storyLevel = { id: 'lvl', pass_score_min: 10, xp_reward: 50 };
  const storyQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: `q${i + 1}`,
    points_snapshot: 10,
  }));
  // 6/10 correct => 60% => not passed (pass is >= 70%)
  const storyAnswersNotPassed = Array.from({ length: 10 }, (_, i) => ({
    session_question_id: `q${i + 1}`,
    is_correct: i < 6,
  }));
  const updated = { ...session, status: 'completed', score_total: 50 };

  const { svc, calls } = createServiceHarness({
    session,
    updated,
    storyMeta,
    storyLevel,
    storyQuestions,
    storyAnswers: storyAnswersNotPassed,
    storyExistingProgress: { best_score: 0, is_completed: false, stars_earned: 0 },
  });
  await svc.finish('s', 'u', 'completed');
  assert.equal(calls.addXp.length, 0);
});

test('XP: custom quiz awards XP only when ratings > 100 and avg > 3', async () => {
  const session = { id: 's', user_id: 'u', mode: 'custom', quiz_id: 'q' };
  const updated = { ...session, status: 'completed', score_total: 123 };

  const low = createServiceHarness({
    session,
    updated,
    ratingsRows: Array.from({ length: 120 }, () => ({ rating: 3 })),
  });
  await low.svc.finish('s', 'u', 'completed');
  assert.equal(low.calls.addXp.length, 0);

  const good = createServiceHarness({
    session,
    updated,
    ratingsRows: Array.from({ length: 120 }, () => ({ rating: 4 })),
  });
  await good.svc.finish('s', 'u', 'completed');
  assert.deepEqual(good.calls.addXp, [{ userId: 'u', xpDelta: 123 }]);
});

