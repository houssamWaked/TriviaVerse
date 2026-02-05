/**
 * Quiz builder service (CRUD for quizzes/questions/options).
 */
import AppError from '../utils/AppError.js';
import QuizDTO from '../domain/dto/QuizDTO.js';
import QuizQuestionDTO from '../domain/dto/QuizQuestionDTO.js';
import QuestionOptionDTO from '../domain/dto/QuestionOptionDTO.js';

export class QuizBuilderService {
  constructor(quizRepository, quizQuestionRepository, questionOptionRepository) {
    this.quizRepository = quizRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
  }

  async createQuiz(userId, payload) {
    const quiz = await this.quizRepository.create({
      owner_user_id: userId,
      title: payload.title,
      description: payload.description ?? null,
      cover_image_url: payload.cover_image_url ?? null,
      visibility: payload.visibility || 'private',
      status: 'draft',
    });
    if (!quiz) throw new AppError('Failed to create quiz', 500, 'DB_ERROR');
    return QuizDTO.fromRow(quiz);
  }

  async getQuiz(userId, quizId) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return QuizDTO.fromRow(quiz);
  }

  async patchQuiz(userId, quizId, patch) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.quizRepository.update(quizId, {
      title: patch.title ?? undefined,
      description: patch.description ?? undefined,
      cover_image_url: patch.cover_image_url ?? undefined,
      visibility: patch.visibility ?? undefined,
    });
    if (!updated) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return QuizDTO.fromRow(updated);
  }

  async publishQuiz(userId, quizId) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.quizRepository.update(quizId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
    if (!updated) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return QuizDTO.fromRow(updated);
  }

  async shareQuiz(userId, quizId, visibility) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.quizRepository.update(quizId, { visibility });
    if (!updated) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return QuizDTO.fromRow(updated);
  }

  async listQuizQuestions(userId, quizId) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    const questionIds = questions.map((q) => q.id);
    const options = await this.questionOptionRepository.listByQuestionIds(questionIds);
    const byQuestionId = new Map();
    for (const opt of options) {
      const list = byQuestionId.get(opt.question_id) || [];
      list.push(QuestionOptionDTO.fromRow(opt));
      byQuestionId.set(opt.question_id, list);
    }

    return questions.map((q) =>
      QuizQuestionDTO.fromRow({
        ...q,
        options: byQuestionId.get(q.id) || [],
      })
    );
  }

  async addQuizQuestion(userId, quizId, payload) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const created = await this.quizQuestionRepository.create({
      quiz_id: quizId,
      question_text: payload.question_text,
      time_limit_sec: payload.time_limit_sec ?? 30,
      points: payload.points ?? 100,
      order_index: payload.order_index ?? 1,
    });
    if (!created) throw new AppError('Failed to create question', 500, 'DB_ERROR');
    return QuizQuestionDTO.fromRow({ ...created, options: [] });
  }

  async patchQuizQuestion(userId, questionId, patch) {
    const q = await this.quizQuestionRepository.findById(questionId);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.quizQuestionRepository.update(questionId, {
      question_text: patch.question_text ?? undefined,
      time_limit_sec: patch.time_limit_sec ?? undefined,
      points: patch.points ?? undefined,
      order_index: patch.order_index ?? undefined,
    });
    if (!updated) throw new AppError('Question not found', 404, 'NOT_FOUND');
    return QuizQuestionDTO.fromRow({ ...updated, options: [] });
  }

  async deleteQuizQuestion(userId, questionId) {
    const q = await this.quizQuestionRepository.findById(questionId);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await this.questionOptionRepository.deleteByQuestionId(questionId);
    const ok = await this.quizQuestionRepository.delete(questionId);
    if (!ok) throw new AppError('Question not found', 404, 'NOT_FOUND');
    return true;
  }

  async addQuestionOption(userId, questionId, payload) {
    const q = await this.quizQuestionRepository.findById(questionId);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const created = await this.questionOptionRepository.create({
      question_id: questionId,
      option_text: payload.option_text,
      is_correct: payload.is_correct ?? false,
      order_index: payload.order_index,
    });
    if (!created) throw new AppError('Failed to create option', 500, 'DB_ERROR');
    return QuestionOptionDTO.fromRow(created);
  }

  async patchQuestionOption(userId, optionId, patch) {
    const opt = await this.questionOptionRepository.findById(optionId);
    if (!opt) throw new AppError('Option not found', 404, 'NOT_FOUND');
    const q = await this.quizQuestionRepository.findById(opt.question_id);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.questionOptionRepository.update(optionId, {
      option_text: patch.option_text ?? undefined,
      is_correct: patch.is_correct ?? undefined,
      order_index: patch.order_index ?? undefined,
    });
    if (!updated) throw new AppError('Option not found', 404, 'NOT_FOUND');
    return QuestionOptionDTO.fromRow(updated);
  }

  async deleteQuestionOption(userId, optionId) {
    const opt = await this.questionOptionRepository.findById(optionId);
    if (!opt) throw new AppError('Option not found', 404, 'NOT_FOUND');
    const q = await this.quizQuestionRepository.findById(opt.question_id);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const ok = await this.questionOptionRepository.delete(optionId);
    if (!ok) throw new AppError('Option not found', 404, 'NOT_FOUND');
    return true;
  }
}

