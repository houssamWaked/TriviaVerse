/**
 * Friends service (requests + friend list + friend stats).
 */
import AppError from '../utils/AppError.js';

type ErrorWithCode = { code?: string };

type UserLike = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type FriendRequestLike = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string | null;
};

type FriendRepositoryLike = {
  areFriends(userId: string, otherUserId: string): Promise<boolean>;
  findRequestBetween(fromUserId: string, toUserId: string): Promise<FriendRequestLike | null>;
  createFriendshipPair(userA: string, userB: string): Promise<true>;
  deleteRequest(requestId: string): Promise<boolean>;
  createRequest(input: { from_user_id: string; to_user_id: string }): Promise<FriendRequestLike | null>;
  listIncomingRequests(userId: string): Promise<FriendRequestLike[]>;
  listOutgoingRequests(userId: string): Promise<FriendRequestLike[]>;
  findRequestById(requestId: string): Promise<FriendRequestLike | null>;
  listFriendIdsForUser(userId: string): Promise<string[]>;
};

type UserRepositoryLike = {
  findByUsername(username: string): Promise<UserLike | null>;
  findByIds(userIds: string[]): Promise<UserLike[]>;
  findById(userId: string): Promise<UserLike | null>;
};

type UserStatsRepositoryLike = {
  findByUserId(userId: string): Promise<unknown>;
};

type QuizScoreRowLike = {
  quiz_id: string;
  best_score?: number | null;
  updated_at?: string | null;
};

type QuizScoreRepositoryLike = {
  listByUserId(userId: string, limit?: number): Promise<QuizScoreRowLike[]>;
};

type QuizLike = {
  id: string;
  title?: string | null;
  visibility?: string | null;
  owner_user_id?: string | null;
};

type QuizRepositoryLike = {
  findByIds(quizIds: string[]): Promise<QuizLike[]>;
};

type GameSessionLike = {
  mode?: string;
  started_at?: string | null;
  ended_at?: string | null;
  score_total?: number | null;
  status?: string | null;
};

type GameSessionRepositoryLike = {
  listByUserId(userId: string, limit?: number): Promise<GameSessionLike[]>;
};

type StoryServiceLike = {
  getUserProgress(userId: string): Promise<unknown>;
};

function isoMax(a: string | null, b: string | null): string | null {
  if (!a) return b || null;
  if (!b) return a || null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta)) return b;
  if (!Number.isFinite(tb)) return a;
  return tb > ta ? b : a;
}

function buildModeSummary(sessions: GameSessionLike[] = []) {
  const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'] as const;
  const byMode = Object.fromEntries(
    modes.map((mode) => [mode, { mode, played: 0, completed: 0, best_score: 0, last_played_at: null as string | null }])
  ) as Record<(typeof modes)[number], { mode: string; played: number; completed: number; best_score: number; last_played_at: string | null }>;

  for (const session of sessions) {
    const mode = session?.mode as keyof typeof byMode | undefined;
    if (!mode || !byMode[mode]) continue;
    byMode[mode].played += 1;
    const endedAt = session?.ended_at || session?.started_at || null;
    byMode[mode].last_played_at = isoMax(byMode[mode].last_played_at, endedAt);
    const status = session?.status;
    const finished =
      status === 'completed' ||
      (mode === 'blitz' && status === 'abandoned') ||
      (mode === 'millionaire' && status === 'abandoned');
    if (finished) {
      byMode[mode].completed += 1;
      byMode[mode].best_score = Math.max(byMode[mode].best_score, Number(session?.score_total) || 0);
    }
  }

  const all = modes.reduce(
    (acc, mode) => {
      acc.played += byMode[mode].played;
      acc.completed += byMode[mode].completed;
      acc.last_played_at = isoMax(acc.last_played_at, byMode[mode].last_played_at);
      return acc;
    },
    { mode: 'all', played: 0, completed: 0, last_played_at: null as string | null }
  );

  return { all, by_mode: byMode };
}

export class FriendService {
  friendRepository: FriendRepositoryLike;
  userRepository: UserRepositoryLike;
  userStatsRepository: UserStatsRepositoryLike;
  quizScoreRepository: QuizScoreRepositoryLike;
  quizRepository: QuizRepositoryLike;
  gameSessionRepository: GameSessionRepositoryLike;
  storyService: StoryServiceLike;

  constructor({
    friendRepository,
    userRepository,
    userStatsRepository,
    quizScoreRepository,
    quizRepository,
    gameSessionRepository,
    storyService,
  }: {
    friendRepository: FriendRepositoryLike;
    userRepository: UserRepositoryLike;
    userStatsRepository: UserStatsRepositoryLike;
    quizScoreRepository: QuizScoreRepositoryLike;
    quizRepository: QuizRepositoryLike;
    gameSessionRepository: GameSessionRepositoryLike;
    storyService: StoryServiceLike;
  }) {
    this.friendRepository = friendRepository;
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRepository = quizRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.storyService = storyService;
  }

  async sendRequest(userId: string, username: string) {
    const target = await this.userRepository.findByUsername(username);
    if (!target) throw new AppError('User not found', 404, 'NOT_FOUND');
    if (target.id === userId) throw new AppError('Cannot add yourself', 400, 'INVALID_INPUT');

    let alreadyFriends = false;
    try {
      alreadyFriends = await this.friendRepository.areFriends(userId, target.id);
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }
    if (alreadyFriends) {
      return {
        status: 'friends',
        user: { id: target.id, username: target.username, avatar_url: target.avatar_url },
      };
    }

    try {
      const incoming = await this.friendRepository.findRequestBetween(target.id, userId);
      if (incoming?.id) {
        await this.friendRepository.createFriendshipPair(userId, target.id);
        await this.friendRepository.deleteRequest(incoming.id);
        return {
          status: 'friends',
          user: { id: target.id, username: target.username, avatar_url: target.avatar_url },
        };
      }
    } catch (err) {
      if ((err as ErrorWithCode)?.code !== 'NOT_CONFIGURED') throw err;
    }

    let request: FriendRequestLike | null = null;
    try {
      request = await this.friendRepository.createRequest({ from_user_id: userId, to_user_id: target.id });
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'DUPLICATE') {
        request = await this.friendRepository.findRequestBetween(userId, target.id);
      } else {
        throw err;
      }
    }

    if (!request) throw new AppError('Failed to create request', 500, 'DB_ERROR');
    return {
      status: 'requested',
      request: { id: request.id, created_at: request.created_at },
      user: { id: target.id, username: target.username, avatar_url: target.avatar_url },
    };
  }

  async listRequests(userId: string) {
    let incoming: FriendRequestLike[] = [];
    let outgoing: FriendRequestLike[] = [];
    try {
      incoming = await this.friendRepository.listIncomingRequests(userId);
      outgoing = await this.friendRepository.listOutgoingRequests(userId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') return { incoming: [], outgoing: [] };
      throw err;
    }

    const userIds = Array.from(
      new Set([...incoming.map((row) => row.from_user_id), ...outgoing.map((row) => row.to_user_id)].filter(Boolean))
    );
    const users = await this.userRepository.findByIds(userIds);
    const map = new Map(users.map((user) => [user.id, user]));

    return {
      incoming: incoming.map((row) => {
        const user = map.get(row.from_user_id);
        return {
          request_id: row.id,
          created_at: row.created_at,
          user: user ? { id: user.id, username: user.username, avatar_url: user.avatar_url } : null,
        };
      }),
      outgoing: outgoing.map((row) => {
        const user = map.get(row.to_user_id);
        return {
          request_id: row.id,
          created_at: row.created_at,
          user: user ? { id: user.id, username: user.username, avatar_url: user.avatar_url } : null,
        };
      }),
    };
  }

  async acceptRequest(userId: string, requestId: string) {
    const requestRow = await this.friendRepository.findRequestById(requestId);
    if (!requestRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (requestRow.to_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await this.friendRepository.createFriendshipPair(requestRow.from_user_id, requestRow.to_user_id);
    await this.friendRepository.deleteRequest(requestRow.id);
    const friend = await this.userRepository.findById(requestRow.from_user_id);
    return {
      success: true,
      friend: friend ? { id: friend.id, username: friend.username, avatar_url: friend.avatar_url } : null,
    };
  }

  async declineRequest(userId: string, requestId: string) {
    const requestRow = await this.friendRepository.findRequestById(requestId);
    if (!requestRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (requestRow.to_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    await this.friendRepository.deleteRequest(requestRow.id);
    return { success: true };
  }

  async cancelRequest(userId: string, requestId: string) {
    const requestRow = await this.friendRepository.findRequestById(requestId);
    if (!requestRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (requestRow.from_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    await this.friendRepository.deleteRequest(requestRow.id);
    return { success: true };
  }

  async listFriends(userId: string) {
    let friendIds: string[] = [];
    try {
      friendIds = await this.friendRepository.listFriendIdsForUser(userId);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') return [];
      throw err;
    }
    const users = await this.userRepository.findByIds(friendIds);
    return users.map((user) => ({ id: user.id, username: user.username, avatar_url: user.avatar_url }));
  }

  async getFriendProfile(userId: string, friendUserId: string) {
    const ok = await this.friendRepository.areFriends(userId, friendUserId);
    if (!ok) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const friend = await this.userRepository.findById(friendUserId);
    if (!friend) throw new AppError('User not found', 404, 'NOT_FOUND');

    const [stats, sessions] = await Promise.all([
      this.userStatsRepository.findByUserId(friendUserId),
      this.gameSessionRepository.listByUserId(friendUserId, 500),
    ]);
    const mode_summary = buildModeSummary(sessions);

    let story_progress: unknown = null;
    try {
      story_progress = await this.storyService.getUserProgress(friendUserId);
    } catch {
      story_progress = null;
    }

    let scoreRows: QuizScoreRowLike[] = [];
    try {
      scoreRows = await this.quizScoreRepository.listByUserId(friendUserId, 100);
    } catch (err) {
      if ((err as ErrorWithCode)?.code === 'NOT_CONFIGURED') {
        return {
          user: { id: friend.id, username: friend.username, avatar_url: friend.avatar_url },
          user_stats: stats,
          mode_summary,
          story_progress,
          custom_quiz_best: [],
        };
      }
      throw err;
    }

    const quizIds = scoreRows.map((row) => row.quiz_id).filter(Boolean);
    const quizzes = await this.quizRepository.findByIds(quizIds);
    const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

    const custom_quiz_best = scoreRows
      .map((row) => {
        const quiz = quizMap.get(row.quiz_id);
        return {
          quiz_id: row.quiz_id,
          title: quiz?.title ?? null,
          visibility: quiz?.visibility ?? null,
          owner_user_id: quiz?.owner_user_id ?? null,
          best_score: row.best_score ?? 0,
          updated_at: row.updated_at ?? null,
        };
      })
      .filter((item) => {
        if (!item.title) return false;
        if (item.visibility !== 'private') return true;
        return item.owner_user_id === friendUserId || item.owner_user_id === userId;
      })
      .map(({ owner_user_id, visibility, ...rest }) => rest)
      .slice(0, 50);

    return {
      user: { id: friend.id, username: friend.username, avatar_url: friend.avatar_url },
      user_stats: stats,
      mode_summary,
      story_progress,
      custom_quiz_best,
    };
  }
}
