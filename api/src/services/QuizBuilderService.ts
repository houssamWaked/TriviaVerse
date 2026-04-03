/**
 * Quiz builder service (CRUD for quizzes/questions/options).
 */
import AppError from '../utils/AppError.js';
import QuizDTO from '../domain/dto/QuizDTO.js';
import QuizQuestionDTO from '../domain/dto/QuizQuestionDTO.js';
import QuestionOptionDTO from '../domain/dto/QuestionOptionDTO.js';

type ErrorWithCode = Error & {
  code?: string;
};

type QuizLike = {
  id: string;
  owner_user_id: string;
  title?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  visibility?: string | null;
  status?: string | null;
  published_at?: string | null;
  keywords?: string | null;
};

type QuizQuestionLike = {
  id: string;
  quiz_id: string;
  order_index?: number | null;
  question_text?: string | null;
  explanation?: string | null;
  time_limit_sec?: number | null;
  points?: number | null;
};

type QuestionOptionLike = {
  id: string;
  question_id: string;
  option_text?: string | null;
  is_correct?: boolean | null;
  order_index?: number | null;
};

type QuizAccessRowLike = {
  quiz_id: string;
  user_id: string;
};

type UserLike = {
  id: string;
  username: string;
  avatar_url?: string | null;
};

type QuizRatingLike = {
  rating?: number | null;
};

type QuizScoreLike = {
  quiz_id: string;
  best_score?: number | null;
  updated_at?: string | null;
};

type QuizRepositoryLike = {
  create(input: Record<string, unknown>): Promise<QuizLike | null>;
  listByOwnerUserId(userId: string): Promise<QuizLike[]>;
  findById(id: string): Promise<QuizLike | null>;
  update(id: string, patch: Record<string, unknown>): Promise<QuizLike | null>;
  findByIds(ids: string[]): Promise<QuizLike[]>;
  delete(id: string): Promise<boolean>;
};

type QuizQuestionRepositoryLike = {
  listByQuizId(quizId: string): Promise<QuizQuestionLike[]>;
  create(input: Record<string, unknown>): Promise<QuizQuestionLike | null>;
  findById(id: string): Promise<QuizQuestionLike | null>;
  update(id: string, patch: Record<string, unknown>): Promise<QuizQuestionLike | null>;
  deleteByQuizId(quizId: string): Promise<unknown>;
};

type QuestionOptionRepositoryLike = {
  listByQuestionIds(questionIds: string[]): Promise<QuestionOptionLike[]>;
  create(input: Record<string, unknown>): Promise<QuestionOptionLike | null>;
  findById(id: string): Promise<QuestionOptionLike | null>;
  update(id: string, patch: Record<string, unknown>): Promise<QuestionOptionLike | null>;
  deleteByQuestionIds(questionIds: string[]): Promise<unknown>;
};

type UserRepositoryLike = {
  findByIds(ids: string[]): Promise<UserLike[]>;
  findByUsername(username: string): Promise<UserLike | null>;
};

type QuizAccessRepositoryLike = {
  listQuizIdsForUser(userId: string): Promise<string[]>;
  listByQuizId(quizId: string): Promise<QuizAccessRowLike[]>;
  add(input: { quiz_id: string; user_id: string }): Promise<unknown>;
  remove(input: { quiz_id: string; user_id: string }): Promise<boolean>;
  deleteByQuizId(quizId: string): Promise<unknown>;
};

type FriendRepositoryLike = {
  areFriends(userId: string, otherUserId: string): Promise<boolean>;
  listFriendIdsForUser(userId: string): Promise<string[]>;
};

type QuizRatingRepositoryLike = {
  upsert(input: { quiz_id: string; user_id: string; rating: number }): Promise<unknown>;
  listByQuizId(quizId: string): Promise<QuizRatingLike[]>;
  deleteByQuizId(quizId: string): Promise<unknown>;
};

type QuizScoreRepositoryLike = {
  listByUserId(userId: string, limit?: number): Promise<QuizScoreLike[]>;
  deleteByQuizId(quizId: string): Promise<unknown>;
};

type GameSessionRepositoryLike = {
  clearQuizIdForQuiz?(quizId: string): Promise<unknown>;
};

type StoryLevelPoolRepositoryLike = {
  deleteByQuizQuestionIds?(questionIds: string[]): Promise<unknown>;
};

type SessionQuestionRepositoryLike = {
  clearSourceQuestionIds?(questionIds: string[]): Promise<unknown>;
};

type CreateQuizInput = {
  title: string;
  description?: string | null;
  keywords?: string | null;
  cover_image_url?: string | null;
  visibility?: string | null;
};

type PatchQuizInput = {
  title?: string;
  description?: string | null;
  keywords?: string | null;
  cover_image_url?: string | null;
  visibility?: string | null;
};

type AddQuestionInput = {
  question_text: string;
  explanation?: string | null;
  time_limit_sec?: number | null;
  points?: number | null;
  order_index?: number | null;
};

type PatchQuestionInput = {
  question_text?: string;
  explanation?: string | null;
  time_limit_sec?: number | null;
  points?: number | null;
  order_index?: number | null;
};

type AddOptionInput = {
  option_text: string;
  is_correct?: boolean | null;
  order_index?: number | null;
};

type PatchOptionInput = {
  option_text?: string;
  is_correct?: boolean | null;
  order_index?: number | null;
};

function normalizeKeywords(input: unknown): string | null {
  if (input == null) return null;
  const raw = String(input || '').trim();
  if (!raw) return null;

  // Split by comma/space, allow alnum + _ - only (safe for PostgREST `.or` filters).
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[^a-z0-9_-]/gi, ''))
    .map((t) => t.toLowerCase())
    .filter(Boolean);

  const unique = Array.from(new Set(tokens)).slice(0, 12);
  const clipped = unique.map((t) => t.slice(0, 24)).filter(Boolean);
  return clipped.length ? clipped.join(' ') : null;
}

export class QuizBuilderService {
  private quizRepository: QuizRepositoryLike;
  private quizQuestionRepository: QuizQuestionRepositoryLike;
  private questionOptionRepository: QuestionOptionRepositoryLike;
  private userRepository: UserRepositoryLike;
  private quizAccessRepository: QuizAccessRepositoryLike;
  private friendRepository: FriendRepositoryLike;
  private quizRatingRepository: QuizRatingRepositoryLike;
  private quizScoreRepository: QuizScoreRepositoryLike;
  private gameSessionRepository: GameSessionRepositoryLike;
  private storyLevelPoolRepository: StoryLevelPoolRepositoryLike;
  private sessionQuestionRepository: SessionQuestionRepositoryLike;

  constructor(
    quizRepository: QuizRepositoryLike,
    quizQuestionRepository: QuizQuestionRepositoryLike,
    questionOptionRepository: QuestionOptionRepositoryLike,
    userRepository: UserRepositoryLike,
    quizAccessRepository: QuizAccessRepositoryLike,
    friendRepository: FriendRepositoryLike,
    quizRatingRepository: QuizRatingRepositoryLike,
    quizScoreRepository: QuizScoreRepositoryLike,
    gameSessionRepository: GameSessionRepositoryLike,
    storyLevelPoolRepository: StoryLevelPoolRepositoryLike,
    sessionQuestionRepository: SessionQuestionRepositoryLike
  ) {
    this.quizRepository = quizRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.userRepository = userRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.friendRepository = friendRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.storyLevelPoolRepository = storyLevelPoolRepository;
    this.sessionQuestionRepository = sessionQuestionRepository;
  }

  async assertCanViewQuiz(userId: string | null | undefined, quiz: QuizLike | null) {
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
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
      try {
        const allowed = await this.quizAccessRepository.listQuizIdsForUser(userId);
        if (allowed.includes(quiz.id)) return true;
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  async createQuiz(userId: string, payload: CreateQuizInput) {
    const keywords = normalizeKeywords(payload.keywords);
    const quiz = await this.quizRepository.create({
      owner_user_id: userId,
      title: payload.title,
      description: payload.description ?? null,
      ...(keywords ? { keywords } : {}),
      cover_image_url: payload.cover_image_url ?? null,
      visibility: payload.visibility || 'private',
      status: 'draft',
    });
    if (!quiz) throw new AppError('Failed to create quiz', 500, 'DB_ERROR');
    return QuizDTO.fromRow(quiz as any);
  }

  async listQuizzes(userId: string) {
    const rows = await this.quizRepository.listByOwnerUserId(userId);
    return rows.map((r) => QuizDTO.fromRow(r as any));
  }

  async getQuiz(userId: string, quizId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return QuizDTO.fromRow(quiz as any);
  }

  async patchQuiz(userId: string, quizId: string, patch: PatchQuizInput) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const update: Record<string, unknown> = {
      title: patch.title ?? undefined,
      description: patch.description ?? undefined,
      cover_image_url: patch.cover_image_url ?? undefined,
      visibility: patch.visibility ?? undefined,
    };

    if (patch.keywords !== undefined) {
      update.keywords = patch.keywords === null ? null : normalizeKeywords(patch.keywords);
    }

    const updated = await this.quizRepository.update(quizId, update);
    if (!updated) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return QuizDTO.fromRow(updated as any);
  }

  async publishQuiz(userId: string, quizId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    if (questions.length === 0) {
      throw new AppError('Add at least 1 question before publishing', 400, 'INVALID_QUIZ');
    }
    const questionIds = questions.map((q) => q.id).filter(Boolean);
    const options = await this.questionOptionRepository.listByQuestionIds(questionIds);

    const countsByQuestionId = new Map<string, number>();
    const correctByQuestionId = new Map<string, number>();
    for (const opt of options) {
      const qid = opt.question_id;
      if (!qid) continue;
      countsByQuestionId.set(qid, (countsByQuestionId.get(qid) || 0) + 1);
      if (opt.is_correct) {
        correctByQuestionId.set(qid, (correctByQuestionId.get(qid) || 0) + 1);
      }
    }

    for (const q of questions) {
      const count = countsByQuestionId.get(q.id) || 0;
      const correct = correctByQuestionId.get(q.id) || 0;
      if (count < 2) {
        throw new AppError(
          `Question ${q.order_index ?? ''} must have at least 2 options`,
          400,
          'INVALID_QUIZ'
        );
      }
      if (correct !== 1) {
        throw new AppError(
          `Question ${q.order_index ?? ''} must have exactly 1 correct option (currently ${correct})`,
          400,
          'INVALID_QUIZ'
        );
      }
    }

    const updated = await this.quizRepository.update(quizId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
    if (!updated) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return QuizDTO.fromRow(updated as any);
  }

  async listQuizQuestions(userId: string, quizId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    const questionIds = questions.map((q) => q.id);
    const options = await this.questionOptionRepository.listByQuestionIds(questionIds);
    const byQuestionId = new Map<string, ReturnType<typeof QuestionOptionDTO.fromRow>[]>();
    for (const opt of options) {
      const list = byQuestionId.get(opt.question_id) || [];
      list.push(QuestionOptionDTO.fromRow(opt as any));
      byQuestionId.set(opt.question_id, list);
    }

    return questions.map((q) =>
      QuizQuestionDTO.fromRow({
        ...q,
        options: byQuestionId.get(q.id) || [],
      } as any)
    );
  }

  async addQuizQuestion(userId: string, quizId: string, payload: AddQuestionInput) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const created = await this.quizQuestionRepository.create({
      quiz_id: quizId,
      question_text: payload.question_text,
      explanation: payload.explanation ?? null,
      time_limit_sec: payload.time_limit_sec ?? 30,
      points: payload.points ?? 100,
      order_index: payload.order_index ?? 1,
    });
    if (!created) throw new AppError('Failed to create question', 500, 'DB_ERROR');
    return QuizQuestionDTO.fromRow({ ...created, options: [] } as any);
  }

  async patchQuizQuestion(userId: string, questionId: string, patch: PatchQuestionInput) {
    const q = await this.quizQuestionRepository.findById(questionId);
    if (!q) throw new AppError('Question not found', 404, 'NOT_FOUND');
    const quiz = await this.quizRepository.findById(q.quiz_id);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await this.quizQuestionRepository.update(questionId, {
      question_text: patch.question_text ?? undefined,
      explanation: patch.explanation ?? undefined,
      time_limit_sec: patch.time_limit_sec ?? undefined,
      points: patch.points ?? undefined,
      order_index: patch.order_index ?? undefined,
    });
    if (!updated) throw new AppError('Question not found', 404, 'NOT_FOUND');
    return QuizQuestionDTO.fromRow({ ...updated, options: [] } as any);
  }

  async addQuestionOption(userId: string, questionId: string, payload: AddOptionInput) {
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
    return QuestionOptionDTO.fromRow(created as any);
  }

  async patchQuestionOption(userId: string, optionId: string, patch: PatchOptionInput) {
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
    return QuestionOptionDTO.fromRow(updated as any);
  }

  async rateQuiz(userId: string, quizId: string, rating: number) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.status !== 'published' && quiz.owner_user_id !== userId) {
      throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    }

    await this.assertCanViewQuiz(userId, quiz);

    await this.quizRatingRepository.upsert({
      quiz_id: quizId,
      user_id: userId,
      rating: Number(rating),
    });

    const rows = await this.quizRatingRepository.listByQuizId(quizId);
    const sum = rows.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const count = rows.length;
    const ratings_avg = count ? Math.round((sum / count) * 100) / 100 : 0;

    return { ratings_avg, ratings_count: count, my_rating: Number(rating) };
  }

  async listQuizAccess(userId: string, quizId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const rows = await this.quizAccessRepository.listByQuizId(quizId);
    const ids = rows.map((r) => r.user_id).filter(Boolean);
    const users = await this.userRepository.findByIds(ids);
    const map = new Map(users.map((u) => [u.id, u]));

    return rows
      .map((r) => map.get(r.user_id))
      .filter(Boolean)
      .map((u) => ({ user_id: u.id, username: u.username, avatar_url: u.avatar_url }));
  }

  async addQuizAccess(userId: string, quizId: string, { username }: { username: string }) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const target = await this.userRepository.findByUsername(username);
    if (!target) throw new AppError('User not found', 404, 'NOT_FOUND');
    if (target.id === userId) throw new AppError('Cannot add yourself', 400, 'INVALID_INPUT');

    await this.quizAccessRepository.add({ quiz_id: quizId, user_id: target.id });
    return { user_id: target.id, username: target.username, avatar_url: target.avatar_url };
  }

  async removeQuizAccess(userId: string, quizId: string, targetUserId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const ok = await this.quizAccessRepository.remove({
      quiz_id: quizId,
      user_id: targetUserId,
    });
    if (!ok) throw new AppError('Access not found', 404, 'NOT_FOUND');
    return { success: true };
  }

  async listMyPlayedQuizzes(userId: string) {
    let rows: QuizScoreLike[] = [];
    try {
      rows = await this.quizScoreRepository.listByUserId(userId, 200);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') return [];
      throw err;
    }

    const quizIds = rows.map((r) => r.quiz_id).filter(Boolean);
    const quizzes = await this.quizRepository.findByIds(quizIds);
    const quizMap = new Map(quizzes.map((q) => [q.id, q]));

    let allowedPrivate = new Set<string>();
    try {
      const ids = await this.quizAccessRepository.listQuizIdsForUser(userId);
      allowedPrivate = new Set(ids);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    let friendIds = new Set<string>();
    try {
      const ids = await this.friendRepository.listFriendIdsForUser(userId);
      friendIds = new Set(ids);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    return rows
      .map((r) => {
        const quiz = quizMap.get(r.quiz_id);
        return {
          quiz_id: r.quiz_id,
          title: quiz?.title ?? null,
          visibility: quiz?.visibility ?? null,
          status: quiz?.status ?? null,
          owner_user_id: quiz?.owner_user_id ?? null,
          best_score: r.best_score ?? 0,
          updated_at: r.updated_at ?? null,
        };
      })
      .filter((x) => {
        if (!x.title) return false;
        if (x.visibility !== 'private') return true;
        if (x.owner_user_id === userId) return true;
        if (friendIds.has(x.owner_user_id)) return true;
        return allowedPrivate.has(x.quiz_id);
      })
      .map(({ owner_user_id, ...rest }) => rest);
  }

  async deleteQuiz(userId: string, quizId: string) {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.owner_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    // Reduce chance of FK violations if game_sessions references quizzes.
    try {
      await this.gameSessionRepository?.clearQuizIdForQuiz(quizId);
    } catch {
      // best-effort; continue with deletion attempt
    }

    // Clean related tables if configured (safe to ignore when missing).
    try {
      await this.quizAccessRepository.deleteByQuizId(quizId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    try {
      await this.quizRatingRepository.deleteByQuizId(quizId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    try {
      await this.quizScoreRepository.deleteByQuizId(quizId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    const questionIds = questions.map((q) => q.id).filter(Boolean);

    // If these questions were (incorrectly) included in story pools, remove them.
    // Also, preserve existing session snapshots by clearing FK reference if present.
    try {
      await this.storyLevelPoolRepository?.deleteByQuizQuestionIds(questionIds);
    } catch {
      // best-effort
    }
    try {
      await this.sessionQuestionRepository?.clearSourceQuestionIds(questionIds);
    } catch {
      // best-effort
    }

    await this.questionOptionRepository.deleteByQuestionIds(questionIds);
    await this.quizQuestionRepository.deleteByQuizId(quizId);

    const ok = await this.quizRepository.delete(quizId);
    if (!ok) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    return { success: true };
  }
}

