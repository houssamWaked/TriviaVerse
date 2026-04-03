import test from 'node:test';
import assert from 'node:assert/strict';

import { SessionService } from '../src/services/SessionService.js';
import { sessionCache } from '../src/utils/sessionCache.js';

function throwingRepo() {
  const handler = {
    get() {
      return () => {
        throw new Error('DB repo should not be called for guest sessions');
      };
    },
  };
  return new Proxy({}, handler);
}

function createService() {
  return new SessionService({
    gameSessionRepository: throwingRepo(),
    sessionQuestionRepository: throwingRepo(),
    sessionOptionRepository: throwingRepo(),
    sessionAnswerRepository: throwingRepo(),
    sessionLifelineRepository: throwingRepo(),
    leaderboardRepository: throwingRepo(),
    userStatsRepository: throwingRepo(),
    quizQuestionRepository: throwingRepo(),
    quizScoreRepository: throwingRepo(),
    quizRatingRepository: throwingRepo(),
    storyLevelRepository: throwingRepo(),
    userStoryProgressRepository: throwingRepo(),
    storySessionRepository: throwingRepo(),
    sessionStartService: throwingRepo(),
  });
}

test('Guest classic sessions score in cache only', async () => {
  const service = createService();

  const sessionId = '11111111-1111-1111-1111-111111111111';
  const q1 = '22222222-2222-2222-2222-222222222222';
  const oCorrect = '33333333-3333-3333-3333-333333333333';
  const oWrong = '44444444-4444-4444-4444-444444444444';

  sessionCache.set(sessionId, {
    is_guest: true,
    mode: 'classic',
    user_id: null,
    started_at: new Date().toISOString(),
    score_total: 0,
    status: 'in_progress',
    current_index: 0,
    questions: [
      {
        session_question_id: q1,
        mode: 'classic',
        question_number: 1,
        total_questions: 1,
        question_text: 'Q1',
        time_limit_sec: 30,
        points: 100,
        options: [
          { id: oCorrect, label: 'A', text: 'A' },
          { id: oWrong, label: 'B', text: 'B' },
        ],
      },
    ],
    correct_option_id_by_session_question_id: { [q1]: oCorrect },
    lifelines: [],
  });

  const res1 = await service.submitAnswer(sessionId, null, {
    session_question_id: q1,
    chosen_option_id: oCorrect,
    answered_in_sec: 1,
  });
  assert.equal(res1.is_correct, true);
  assert.equal(res1.score_total, 100);
  assert.equal(res1.next_question_available, false);

  // Simulate a client retrying the same answer request.
  const cached = sessionCache.get(sessionId);
  sessionCache.set(sessionId, { ...cached, current_index: 0 });

  await assert.rejects(
    () =>
      service.submitAnswer(sessionId, null, {
        session_question_id: q1,
        chosen_option_id: oCorrect,
        answered_in_sec: 1,
      }),
    /Already answered/
  );
});

test('Guest millionaire lifeline skip advances without DB', async () => {
  const service = createService();

  const sessionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const q1 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const oCorrect = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const oWrong = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  sessionCache.set(sessionId, {
    is_guest: true,
    mode: 'millionaire',
    user_id: null,
    started_at: new Date().toISOString(),
    score_total: 0,
    status: 'in_progress',
    current_index: 0,
    questions: [
      {
        session_question_id: q1,
        mode: 'millionaire',
        question_number: 1,
        total_questions: 1,
        question_text: 'Q1',
        time_limit_sec: 30,
        points: 0,
        options: [
          { id: oCorrect, label: 'A', text: 'A' },
          { id: oWrong, label: 'B', text: 'B' },
        ],
      },
    ],
    correct_option_id_by_session_question_id: { [q1]: oCorrect },
    lifelines: [],
  });

  const res = await service.useLifeline(sessionId, null, {
    lifeline_type: 'skip',
    session_question_id: q1,
  });

  assert.equal(res.lifeline_type, 'skip');
  assert.equal(res.skipped, true);
  assert.equal(res.next_question_available, false);
});

