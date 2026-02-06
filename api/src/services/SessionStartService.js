/**
 * Session start service for different game modes.
 *
 * NOTE: The provided schema does not include `category_id` or `difficulty`
 * columns on `quiz_questions`, so classic/blitz/millionaire currently select
 * from the global question pool. The requested `category_id`/`difficulty` are
 * still stored on the created `game_sessions` row for future filtering.
 */
import AppError from '../utils/AppError.js';

export class SessionStartService {
  constructor({
    gameSessionRepository,
    sessionQuestionRepository,
    sessionOptionRepository,
    quizQuestionRepository,
    questionOptionRepository,
    quizRepository,
    quizAccessRepository,
    friendRepository,
    storyLevelRepository,
    storyLevelPoolRepository,
    storyService,
    millionaireLadderRepository,
  }) {
    this.gameSessionRepository = gameSessionRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
    this.sessionOptionRepository = sessionOptionRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.quizRepository = quizRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.friendRepository = friendRepository;
    this.storyLevelRepository = storyLevelRepository;
    this.storyLevelPoolRepository = storyLevelPoolRepository;
    this.storyService = storyService;
    this.millionaireLadderRepository = millionaireLadderRepository;
  }

  async assertCanViewQuiz(userId, quiz) {
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.visibility === 'public') return true;
    if (quiz.visibility === 'unlisted') return true;

    if (quiz.visibility === 'private') {
      if (!userId) throw new AppError('Login required', 401, 'UNAUTHORIZED');
      if (quiz.owner_user_id === userId) return true;
      try {
        const isFriend = await this.friendRepository.areFriends(userId, quiz.owner_user_id);
        if (isFriend) return true;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
      try {
        const allowed = await this.quizAccessRepository.listQuizIdsForUser(userId);
        if (allowed.includes(quiz.id)) return true;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  async snapshotSessionQuestions(sessionId, sourceQuestions) {
    const sessionQuestionsRows = sourceQuestions.map((q, idx) => ({
      session_id: sessionId,
      source_question_id: q.id,
      question_text_snapshot: q.question_text,
      order_index: idx + 1,
      points_snapshot: q.points ?? 0,
      time_limit_snapshot: q.time_limit_sec ?? 30,
    }));

    const createdSessionQuestions = await this.sessionQuestionRepository.createMany(
      sessionQuestionsRows
    );

    const bySourceId = new Map(
      createdSessionQuestions.map((sq) => [sq.source_question_id, sq])
    );
    const options = await this.questionOptionRepository.listByQuestionIds(
      sourceQuestions.map((q) => q.id)
    );

    const optionRows = [];
    for (const opt of options) {
      const sq = bySourceId.get(opt.question_id);
      if (!sq) continue;
      optionRows.push({
        session_question_id: sq.id,
        option_text_snapshot: opt.option_text,
        is_correct_snapshot: opt.is_correct ?? false,
        order_index: opt.order_index,
      });
    }
    await this.sessionOptionRepository.createMany(optionRows);
  }

  async startStorySession(userId, level_number) {
    const level = await this.storyLevelRepository.findByLevelNumber(level_number);
    if (!level) throw new AppError('Level not found', 404, 'NOT_FOUND');

    await this.storyService.assertLevelUnlocked(userId, level);

    const questionIds = await this.storyLevelPoolRepository.listQuestionIdsByLevelId(
      level.id
    );
    if (questionIds.length === 0) {
      throw new AppError('No questions configured for this level', 400, 'NO_POOL');
    }

    const questions = [];
    for (const id of questionIds.slice(0, 10)) {
      // eslint-disable-next-line no-await-in-loop
      const q = await this.quizQuestionRepository.findById(id);
      if (q) questions.push(q);
    }

    const session = await this.gameSessionRepository.create({
      user_id: userId,
      mode: 'story',
      total_questions: questions.length,
      status: 'in_progress',
    });
    if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');

    await this.snapshotSessionQuestions(session.id, questions);

    return {
      session_id: session.id,
      mode: 'story',
      level_number,
      status: session.status,
      total_questions: session.total_questions,
    };
  }

  async startMillionaireSession(userId, ladder_id) {
    const ladder = await this.millionaireLadderRepository.findById(ladder_id);
    if (!ladder) throw new AppError('Ladder not found', 404, 'NOT_FOUND');

    const questions = await this.quizQuestionRepository.listRandom(15);
    const session = await this.gameSessionRepository.create({
      user_id: userId,
      mode: 'millionaire',
      total_questions: questions.length,
      status: 'in_progress',
    });
    if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');

    await this.snapshotSessionQuestions(session.id, questions);

    return {
      session_id: session.id,
      mode: 'millionaire',
      current_question_index: 1,
      total_questions: session.total_questions,
      current_prize: 0,
    };
  }

  async startClassicSession(userId, { category_id, difficulty, questions_count }) {
    const questions = await this.quizQuestionRepository.listRandom(questions_count);
    const session = await this.gameSessionRepository.create({
      user_id: userId,
      mode: 'classic',
      category_id,
      difficulty,
      total_questions: questions.length,
      status: 'in_progress',
    });
    if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');

    await this.snapshotSessionQuestions(session.id, questions);

    return {
      session_id: session.id,
      mode: 'classic',
      total_questions: session.total_questions,
      status: session.status,
    };
  }

  async startBlitzSession(userId, { category_id, difficulty }) {
    const questions = await this.quizQuestionRepository.listRandom(30);
    const session = await this.gameSessionRepository.create({
      user_id: userId,
      mode: 'blitz',
      category_id,
      difficulty,
      total_questions: questions.length,
      status: 'in_progress',
    });
    if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');

    await this.snapshotSessionQuestions(session.id, questions);

    return {
      session_id: session.id,
      mode: 'blitz',
      time_limit_sec: 60,
      status: session.status,
    };
  }

  async startCustomQuizSession(userId, quizId) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.status !== 'published' && quiz.owner_user_id !== userId) {
      throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    }

    await this.assertCanViewQuiz(userId, quiz);

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    if (questions.length === 0) {
      throw new AppError('Quiz has no questions', 400, 'NO_QUESTIONS');
    }

    const session = await this.gameSessionRepository.create({
      user_id: userId,
      mode: 'custom',
      quiz_id: quizId,
      total_questions: questions.length,
      status: 'in_progress',
    });
    if (!session) throw new AppError('Failed to create session', 500, 'DB_ERROR');

    await this.snapshotSessionQuestions(session.id, questions);

    return {
      session_id: session.id,
      mode: 'custom',
      quiz_id: quizId,
      status: session.status,
      total_questions: session.total_questions,
    };
  }
}
