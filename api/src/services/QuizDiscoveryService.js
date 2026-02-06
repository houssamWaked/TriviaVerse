/**
 * Quiz discovery service (public search + viewing with access rules).
 */
import AppError from '../utils/AppError.js';
import QuizDTO from '../domain/dto/QuizDTO.js';
import QuizQuestionDTO from '../domain/dto/QuizQuestionDTO.js';
import QuestionOptionDTO from '../domain/dto/QuestionOptionDTO.js';

function computeRatingsSummary(ratingRows = []) {
  const map = new Map();
  for (const r of ratingRows || []) {
    const id = r.quiz_id;
    if (!id) continue;
    const rating = Number(r.rating);
    if (!Number.isFinite(rating)) continue;
    const prev = map.get(id) || { sum: 0, count: 0 };
    map.set(id, { sum: prev.sum + rating, count: prev.count + 1 });
  }

  const summary = new Map();
  for (const [quizId, { sum, count }] of map.entries()) {
    summary.set(quizId, {
      ratings_avg: count ? Math.round((sum / count) * 100) / 100 : 0,
      ratings_count: count,
    });
  }
  return summary;
}

export class QuizDiscoveryService {
  constructor({
    quizRepository,
    quizQuestionRepository,
    questionOptionRepository,
    userRepository,
    quizAccessRepository,
    friendRepository,
    quizRatingRepository,
    quizScoreRepository,
  }) {
    this.quizRepository = quizRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.questionOptionRepository = questionOptionRepository;
    this.userRepository = userRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.friendRepository = friendRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.quizScoreRepository = quizScoreRepository;
  }

  async search({ q, userId = null, limit = 30 }) {
    const visibilities = userId ? ['public', 'private'] : ['public'];
    const rows = await this.quizRepository.searchPublishedByTitle({ q, visibilities, limit });

    let allowedPrivate = new Set();
    if (userId) {
      try {
        const ids = await this.quizAccessRepository.listQuizIdsForUser(userId);
        allowedPrivate = new Set(ids);
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    let friendIds = new Set();
    if (userId) {
      try {
        const ids = await this.friendRepository.listFriendIdsForUser(userId);
        friendIds = new Set(ids);
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    const visibleRows = rows.filter((quiz) => {
      if (quiz.visibility === 'public') return true;
      if (quiz.visibility !== 'private') return false;
      if (!userId) return false;
      if (quiz.owner_user_id === userId) return true;
      if (friendIds.has(quiz.owner_user_id)) return true;
      return allowedPrivate.has(quiz.id);
    });

    const quizIds = visibleRows.map((qz) => qz.id);

    let ratingsSummary = new Map();
    try {
      const ratingRows = await this.quizRatingRepository.listByQuizIds(quizIds);
      ratingsSummary = computeRatingsSummary(ratingRows);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ownerIds = Array.from(new Set(visibleRows.map((r) => r.owner_user_id).filter(Boolean)));
    const owners = await this.userRepository.findByIds(ownerIds);
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    const payload = visibleRows
      .map((row) => {
        const quiz = QuizDTO.fromRow(row);
        const owner = ownerMap.get(quiz.owner_user_id);
        const ratings = ratingsSummary.get(quiz.id) || { ratings_avg: 0, ratings_count: 0 };
        return {
          ...quiz,
          owner: owner ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url } : null,
          ...ratings,
        };
      })
      .sort((a, b) => {
        if (b.ratings_avg !== a.ratings_avg) return b.ratings_avg - a.ratings_avg;
        if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count;
        const bt = new Date(b.published_at || b.created_at || 0).getTime();
        const at = new Date(a.published_at || a.created_at || 0).getTime();
        return bt - at;
      });

    return { q: String(q || '').trim(), results: payload };
  }

  async top({ userId = null, limit = 20 }) {
    const visibilities = userId ? ['public', 'private'] : ['public'];
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));

    const rows = await this.quizRepository.listPublishedByVisibility({
      visibilities,
      limit: 200,
    });

    let allowedPrivate = new Set();
    if (userId) {
      try {
        const ids = await this.quizAccessRepository.listQuizIdsForUser(userId);
        allowedPrivate = new Set(ids);
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    let friendIds = new Set();
    if (userId) {
      try {
        const ids = await this.friendRepository.listFriendIdsForUser(userId);
        friendIds = new Set(ids);
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    const visibleRows = rows.filter((quiz) => {
      if (quiz.visibility === 'public') return true;
      if (quiz.visibility !== 'private') return false;
      if (!userId) return false;
      if (quiz.owner_user_id === userId) return true;
      if (friendIds.has(quiz.owner_user_id)) return true;
      return allowedPrivate.has(quiz.id);
    });

    const quizIds = visibleRows.map((qz) => qz.id);

    let ratingsSummary = new Map();
    try {
      const ratingRows = await this.quizRatingRepository.listByQuizIds(quizIds);
      ratingsSummary = computeRatingsSummary(ratingRows);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ownerIds = Array.from(
      new Set(visibleRows.map((r) => r.owner_user_id).filter(Boolean))
    );
    const owners = await this.userRepository.findByIds(ownerIds);
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    const payload = visibleRows
      .map((row) => {
        const quiz = QuizDTO.fromRow(row);
        const owner = ownerMap.get(quiz.owner_user_id);
        const ratings = ratingsSummary.get(quiz.id) || { ratings_avg: 0, ratings_count: 0 };
        return {
          ...quiz,
          owner: owner
            ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url }
            : null,
          ...ratings,
        };
      })
      .sort((a, b) => {
        if (b.ratings_avg !== a.ratings_avg) return b.ratings_avg - a.ratings_avg;
        if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count;
        const bt = new Date(b.published_at || b.created_at || 0).getTime();
        const at = new Date(a.published_at || a.created_at || 0).getTime();
        return bt - at;
      })
      .slice(0, lim);

    return { results: payload };
  }

  async assertCanViewQuiz({ quiz, userId }) {
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

    if (quiz.status !== 'published') {
      if (!userId || quiz.owner_user_id !== userId) {
        throw new AppError('Quiz not found', 404, 'NOT_FOUND');
      }
    }

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

  async getQuizDetails({ quizId, userId = null }) {
    const quiz = await this.quizRepository.findById(quizId);
    await this.assertCanViewQuiz({ quiz, userId });

    const isOwner = !!userId && quiz.owner_user_id === userId;

    const questions = await this.quizQuestionRepository.listByQuizId(quizId);
    const questionIds = questions.map((q) => q.id);
    const options = await this.questionOptionRepository.listByQuestionIds(questionIds);

    const optionsByQuestion = new Map();
    for (const opt of options) {
      const list = optionsByQuestion.get(opt.question_id) || [];
      list.push(opt);
      optionsByQuestion.set(opt.question_id, list);
    }

    const questionDtos = questions.map((q) => {
      const opts = (optionsByQuestion.get(q.id) || []).map((o) => {
        const dto = QuestionOptionDTO.fromRow(o);
        if (!isOwner) {
          dto.is_correct = undefined;
        }
        return dto;
      });
      return QuizQuestionDTO.fromRow({ ...q, options: opts });
    });

    const owner = await this.userRepository.findById(quiz.owner_user_id);

    return {
      quiz: {
        ...QuizDTO.fromRow(quiz),
        owner: owner ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url } : null,
      },
      questions: questionDtos,
      can_edit: isOwner,
    };
  }

  async getRatingsSummary({ quizId, userId = null }) {
    let rows = [];
    try {
      rows = await this.quizRatingRepository.listByQuizId(quizId);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') {
        return { ratings_avg: 0, ratings_count: 0, my_rating: null };
      }
      throw err;
    }

    const sum = rows.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const count = rows.length;
    const ratings_avg = count ? Math.round((sum / count) * 100) / 100 : 0;

    let my_rating = null;
    if (userId) {
      try {
        const mine = await this.quizRatingRepository.getUserRating(quizId, userId);
        my_rating = mine?.rating ?? null;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    return { ratings_avg, ratings_count: count, my_rating };
  }

  async getCustomQuizLeaderboard({ quizId, userId = null, limit = 20 }) {
    const quiz = await this.quizRepository.findById(quizId);
    await this.assertCanViewQuiz({ quiz, userId });

    let rows = [];
    try {
      rows = await this.quizScoreRepository.listTopByQuizId(quizId, limit);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') return { quiz_id: quizId, entries: [] };
      throw err;
    }

    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.filter(Boolean).map((u) => [u.id, u]));

    let my_best_score = null;
    if (userId) {
      try {
        const mine = await this.quizScoreRepository.findByQuizAndUser(quizId, userId);
        my_best_score = mine?.best_score ?? null;
      } catch (err) {
        if (err?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    return {
      quiz_id: quizId,
      my_best_score,
      entries: rows.map((r, idx) => {
        const u = userMap.get(r.user_id);
        return {
          rank_position: idx + 1,
          user_id: r.user_id,
          username: u?.username ?? null,
          avatar_url: u?.avatar_url ?? null,
          best_score: r.best_score ?? 0,
          updated_at: r.updated_at ?? null,
        };
      }),
    };
  }
}
