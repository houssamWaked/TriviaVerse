import AppError from '../utils/AppError.js';

type QuizLike = {
  id: string;
  owner_user_id: string;
  status: string;
};

type QuizRepositoryLike = {
  findById(quizId: string): Promise<QuizLike | null>;
};

type QuizReportLike = {
  id?: string | null;
};

type QuizReportRepositoryLike = {
  upsertOpen(input: {
    quiz_id: string;
    reporter_user_id: string;
    reason?: string;
    message?: string | null;
  }): Promise<QuizReportLike | null>;
};

type ReportQuizInput = {
  reason?: string;
  message?: string | null;
};

export class QuizReportService {
  quizRepository: QuizRepositoryLike;
  quizReportRepository: QuizReportRepositoryLike;

  constructor({
    quizRepository,
    quizReportRepository,
  }: {
    quizRepository: QuizRepositoryLike;
    quizReportRepository: QuizReportRepositoryLike;
  }) {
    this.quizRepository = quizRepository;
    this.quizReportRepository = quizReportRepository;
  }

  async reportQuiz(userId: string, quizId: string, { reason = 'other', message = null }: ReportQuizInput = {}) {
    const uid = String(userId || '').trim();
    const qid = String(quizId || '').trim();
    if (!uid) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (!qid) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    const quiz = await this.quizRepository.findById(qid);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id && String(quiz.owner_user_id) === uid) {
      throw new AppError('You cannot report your own quiz', 400, 'INVALID_INPUT');
    }
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
