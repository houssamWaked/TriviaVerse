import AppError from '../utils/AppError.js';

export class QuizReportService {
  constructor({ quizRepository, quizReportRepository }) {
    this.quizRepository = quizRepository;
    this.quizReportRepository = quizReportRepository;
  }

  async reportQuiz(userId, quizId, { reason = 'other', message = null } = {}) {
    const uid = String(userId || '').trim();
    const qid = String(quizId || '').trim();
    if (!uid) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (!qid) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    const quiz = await this.quizRepository.findById(qid);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.owner_user_id && String(quiz.owner_user_id) === uid) {
      throw new AppError('You cannot report your own quiz', 400, 'INVALID_INPUT');
    }

    // Only published quizzes should be reportable via the public UI.
    if (quiz.status && String(quiz.status) !== 'published') {
      throw new AppError('Quiz is not published', 400, 'INVALID_INPUT');
    }

    const created = await this.quizReportRepository.upsertOpen({
      quiz_id: qid,
      reporter_user_id: uid,
      reason,
      message,
    });

    return { success: true, report_id: created?.id || null };
  }
}
