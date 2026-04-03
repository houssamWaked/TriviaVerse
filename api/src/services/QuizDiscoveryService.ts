/**
 * Quiz discovery service (public search + viewing with access rules).
 */
import AppError from '../utils/AppError.js';
import QuizDTO from '../domain/dto/QuizDTO.js';

type ErrorWithCode = { code?: string };

type QuizLike = {
  id: string;
  owner_user_id: string;
  visibility: string;
  status: string;
  published_at?: string | null;
  created_at?: string | null;
};

type RatingRowLike = {
  quiz_id: string;
  rating: number;
};

type QuizScoreRowLike = {
  quiz_id: string;
  user_id: string;
  best_score?: number | null;
  updated_at?: string | null;
};

type UserLike = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type QuizRepositoryLike = {
  searchPublishedByTitle(input: { q: string; visibilities: string[]; limit?: number }): Promise<QuizLike[]>;
  listPublishedByVisibility(input: { visibilities: string[]; limit?: number }): Promise<QuizLike[]>;
  findById(quizId: string): Promise<QuizLike | null>;
};

type QuizQuestionRepositoryLike = {
  countByQuizId(quizId: string): Promise<number>;
};

type UserRepositoryLike = {
  findByIds(userIds: string[]): Promise<UserLike[]>;
  findById(userId: string): Promise<UserLike | null>;
};

type QuizAccessRepositoryLike = {
  listQuizIdsForUser(userId: string): Promise<string[]>;
};

type FriendRepositoryLike = {
  listFriendIdsForUser(userId: string): Promise<string[]>;
  areFriends(userId: string, otherUserId: string): Promise<boolean>;
};

type QuizRatingRepositoryLike = {
  listByQuizIds(quizIds: string[]): Promise<RatingRowLike[]>;
  listByQuizId(quizId: string): Promise<RatingRowLike[]>;
  getUserRating(quizId: string, userId: string): Promise<RatingRowLike | null>;
};

type QuizScoreRepositoryLike = {
  countPlayersByQuizIds(quizIds: string[]): Promise<Map<string, number>>;
  listTopByQuizId(quizId: string, limit?: number): Promise<QuizScoreRowLike[]>;
  findByQuizAndUser(quizId: string, userId: string): Promise<QuizScoreRowLike | null>;
};

type SearchInput = {
  q: string;
  userId?: string | null;
  limit?: number;
};

type TopInput = {
  userId?: string | null;
  limit?: number;
};

type ViewQuizInput = {
  quiz: QuizLike | null;
  userId?: string | null;
};

type QuizDetailsInput = {
  quizId: string;
  userId?: string | null;
};

type RatingsSummaryInput = {
  quizId: string;
  userId?: string | null;
};

type QuizLeaderboardInput = {
  quizId: string;
  userId?: string | null;
  limit?: number;
};

function computeRatingsSummary(ratingRows: RatingRowLike[] = []) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const row of ratingRows) {
    const id = row.quiz_id;
    if (!id) continue;
    const rating = Number(row.rating);
    if (!Number.isFinite(rating)) continue;
    const prev = map.get(id) || { sum: 0, count: 0 };
    map.set(id, { sum: prev.sum + rating, count: prev.count + 1 });
  }

  const summary = new Map<string, { ratings_avg: number; ratings_count: number }>();
  for (const [quizId, { sum, count }] of map.entries()) {
    summary.set(quizId, {
      ratings_avg: count ? Math.round((sum / count) * 100) / 100 : 0,
      ratings_count: count,
    });
  }
  return summary;
}

export class QuizDiscoveryService {
  quizRepository: QuizRepositoryLike;
  quizQuestionRepository: QuizQuestionRepositoryLike;
  userRepository: UserRepositoryLike;
  quizAccessRepository: QuizAccessRepositoryLike;
  friendRepository: FriendRepositoryLike;
  quizRatingRepository: QuizRatingRepositoryLike;
  quizScoreRepository: QuizScoreRepositoryLike;

  constructor({
    quizRepository,
    quizQuestionRepository,
    questionOptionRepository: _questionOptionRepository,
    userRepository,
    quizAccessRepository,
    friendRepository,
    quizRatingRepository,
    quizScoreRepository,
  }: {
    quizRepository: QuizRepositoryLike;
    quizQuestionRepository: QuizQuestionRepositoryLike;
    questionOptionRepository: unknown;
    userRepository: UserRepositoryLike;
    quizAccessRepository: QuizAccessRepositoryLike;
    friendRepository: FriendRepositoryLike;
    quizRatingRepository: QuizRatingRepositoryLike;
    quizScoreRepository: QuizScoreRepositoryLike;
  }) {
    this.quizRepository = quizRepository;
    this.quizQuestionRepository = quizQuestionRepository;
    this.userRepository = userRepository;
    this.quizAccessRepository = quizAccessRepository;
    this.friendRepository = friendRepository;
    this.quizRatingRepository = quizRatingRepository;
    this.quizScoreRepository = quizScoreRepository;
  }

  async search({ q, userId = null, limit = 30 }: SearchInput) {
    const visibilities = userId ? ['public', 'private'] : ['public'];
    const rows = await this.quizRepository.searchPublishedByTitle({ q, visibilities, limit });

    let allowedPrivate = new Set<string>();
    if (userId) {
      try {
        allowedPrivate = new Set(await this.quizAccessRepository.listQuizIdsForUser(userId));
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    let friendIds = new Set<string>();
    if (userId) {
      try {
        friendIds = new Set(await this.friendRepository.listFriendIdsForUser(userId));
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
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

    const quizIds = visibleRows.map((quiz) => quiz.id);
    let ratingsSummary = new Map<string, { ratings_avg: number; ratings_count: number }>();
    try {
      ratingsSummary = computeRatingsSummary(await this.quizRatingRepository.listByQuizIds(quizIds));
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    let playedCounts = new Map<string, number>();
    try {
      playedCounts = await this.quizScoreRepository.countPlayersByQuizIds(quizIds);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ownerIds = Array.from(new Set(visibleRows.map((row) => row.owner_user_id).filter(Boolean)));
    const owners = await this.userRepository.findByIds(ownerIds);
    const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

    const payload = visibleRows
      .map((row) => {
        const quiz = QuizDTO.fromRow(row as any);
        const owner = ownerMap.get(quiz.owner_user_id);
        const ratings = ratingsSummary.get(quiz.id) || { ratings_avg: 0, ratings_count: 0 };
        const played_count = playedCounts.get(quiz.id) || 0;
        return {
          ...quiz,
          owner: owner ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url } : null,
          ...ratings,
          played_count,
        };
      })
      .sort((a, b) => {
        if ((b.played_count || 0) !== (a.played_count || 0)) return (b.played_count || 0) - (a.played_count || 0);
        if (b.ratings_avg !== a.ratings_avg) return b.ratings_avg - a.ratings_avg;
        if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count;
        const bt = new Date(b.published_at || b.created_at || 0).getTime();
        const at = new Date(a.published_at || a.created_at || 0).getTime();
        return bt - at;
      });

    return { q: String(q || '').trim(), results: payload };
  }

  async top({ userId = null, limit = 20 }: TopInput) {
    const visibilities = userId ? ['public', 'private'] : ['public'];
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    const rows = await this.quizRepository.listPublishedByVisibility({ visibilities, limit: 200 });

    let allowedPrivate = new Set<string>();
    if (userId) {
      try {
        allowedPrivate = new Set(await this.quizAccessRepository.listQuizIdsForUser(userId));
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    let friendIds = new Set<string>();
    if (userId) {
      try {
        friendIds = new Set(await this.friendRepository.listFriendIdsForUser(userId));
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
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

    const quizIds = visibleRows.map((quiz) => quiz.id);
    let ratingsSummary = new Map<string, { ratings_avg: number; ratings_count: number }>();
    try {
      ratingsSummary = computeRatingsSummary(await this.quizRatingRepository.listByQuizIds(quizIds));
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    let playedCounts = new Map<string, number>();
    try {
      playedCounts = await this.quizScoreRepository.countPlayersByQuizIds(quizIds);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    const ownerIds = Array.from(new Set(visibleRows.map((row) => row.owner_user_id).filter(Boolean)));
    const owners = await this.userRepository.findByIds(ownerIds);
    const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

    const payload = visibleRows
      .map((row) => {
        const quiz = QuizDTO.fromRow(row as any);
        const owner = ownerMap.get(quiz.owner_user_id);
        const ratings = ratingsSummary.get(quiz.id) || { ratings_avg: 0, ratings_count: 0 };
        const played_count = playedCounts.get(quiz.id) || 0;
        return {
          ...quiz,
          owner: owner ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url } : null,
          ...ratings,
          played_count,
        };
      })
      .sort((a, b) => {
        if ((b.played_count || 0) !== (a.played_count || 0)) return (b.played_count || 0) - (a.played_count || 0);
        if (b.ratings_avg !== a.ratings_avg) return b.ratings_avg - a.ratings_avg;
        if (b.ratings_count !== a.ratings_count) return b.ratings_count - a.ratings_count;
        const bt = new Date(b.published_at || b.created_at || 0).getTime();
        const at = new Date(a.published_at || a.created_at || 0).getTime();
        return bt - at;
      })
      .slice(0, lim);

    return { results: payload };
  }

  async assertCanViewQuiz({ quiz, userId = null }: ViewQuizInput): Promise<true> {
    if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    if (quiz.status !== 'published' && (!userId || quiz.owner_user_id !== userId)) {
      throw new AppError('Quiz not found', 404, 'NOT_FOUND');
    }
    if (quiz.visibility === 'public' || quiz.visibility === 'unlisted') return true;

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

  async getQuizDetails({ quizId, userId = null }: QuizDetailsInput) {
    const quiz = await this.quizRepository.findById(quizId);
    await this.assertCanViewQuiz({ quiz, userId });

    const questions_count = await this.quizQuestionRepository.countByQuizId(quizId);
    const owner = await this.userRepository.findById(quiz!.owner_user_id);

    return {
      quiz: {
        ...QuizDTO.fromRow(quiz as any),
        owner: owner ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url } : null,
      },
      questions_count,
      can_edit: Boolean(userId) && quiz!.owner_user_id === userId,
    };
  }

  async getRatingsSummary({ quizId, userId = null }: RatingsSummaryInput) {
    let rows: RatingRowLike[] = [];
    try {
      rows = await this.quizRatingRepository.listByQuizId(quizId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') {
        return { ratings_avg: 0, ratings_count: 0, my_rating: null };
      }
      throw err;
    }

    const sum = rows.reduce((acc, row) => acc + (Number(row.rating) || 0), 0);
    const count = rows.length;
    const ratings_avg = count ? Math.round((sum / count) * 100) / 100 : 0;

    let my_rating: number | null = null;
    if (userId) {
      try {
        const mine = await this.quizRatingRepository.getUserRating(quizId, userId);
        my_rating = mine?.rating ?? null;
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    return { ratings_avg, ratings_count: count, my_rating };
  }

  async getCustomQuizLeaderboard({ quizId, userId = null, limit = 20 }: QuizLeaderboardInput) {
    const quiz = await this.quizRepository.findById(quizId);
    await this.assertCanViewQuiz({ quiz, userId });

    let rows: QuizScoreRowLike[] = [];
    try {
      rows = await this.quizScoreRepository.listTopByQuizId(quizId, limit);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED' || (err as ErrorWithCode)?.code === 'DB_SCHEMA_MISMATCH') {
        return { quiz_id: quizId, entries: [], not_configured: true };
      }
      throw err;
    }

    const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.filter(Boolean).map((user) => [user.id, user]));

    let my_best_score: number | null = null;
    if (userId) {
      try {
        const mine = await this.quizScoreRepository.findByQuizAndUser(quizId, userId);
        my_best_score = mine?.best_score ?? null;
      } catch (err) {
        if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
      }
    }

    return {
      quiz_id: quizId,
      my_best_score,
      entries: rows.map((row, index) => {
        const user = userMap.get(row.user_id);
        return {
          rank_position: index + 1,
          user_id: row.user_id,
          username: user?.username ?? null,
          avatar_url: user?.avatar_url ?? null,
          best_score: row.best_score ?? 0,
          updated_at: row.updated_at ?? null,
        };
      }),
    };
  }
}
