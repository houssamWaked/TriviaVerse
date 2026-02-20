/**
 * Friends service (requests + friend list + friend stats).
 */
import AppError from '../utils/AppError.js';

function isoMax(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta)) return b;
  if (!Number.isFinite(tb)) return a;
  return tb > ta ? b : a;
}

function buildModeSummary(sessions = []) {
  const modes = ['story', 'classic', 'blitz', 'millionaire', 'custom'];
  const byMode = Object.fromEntries(
    modes.map((m) => [m, { mode: m, played: 0, completed: 0, best_score: 0, last_played_at: null }])
  );

  for (const s of sessions || []) {
    const mode = s?.mode;
    if (!mode || !byMode[mode]) continue;
    byMode[mode].played += 1;

    const endedAt = s?.ended_at || s?.started_at || null;
    byMode[mode].last_played_at = isoMax(byMode[mode].last_played_at, endedAt);

    const status = s?.status;
    const finished =
      status === 'completed' ||
      (mode === 'blitz' && status === 'abandoned') ||
      (mode === 'millionaire' && status === 'abandoned');

    if (finished) {
      byMode[mode].completed += 1;
      byMode[mode].best_score = Math.max(byMode[mode].best_score, Number(s?.score_total) || 0);
    }
  }

  const all = modes.reduce(
    (acc, m) => {
      acc.played += byMode[m].played;
      acc.completed += byMode[m].completed;
      acc.last_played_at = isoMax(acc.last_played_at, byMode[m].last_played_at);
      return acc;
    },
    { mode: 'all', played: 0, completed: 0, last_played_at: null }
  );

  return { all, by_mode: byMode };
}

export class FriendService {
  constructor({
    friendRepository,
    userRepository,
    userStatsRepository,
    quizScoreRepository,
    quizRepository,
    gameSessionRepository,
    storyService,
  }) {
    this.friendRepository = friendRepository;
    this.userRepository = userRepository;
    this.userStatsRepository = userStatsRepository;
    this.quizScoreRepository = quizScoreRepository;
    this.quizRepository = quizRepository;
    this.gameSessionRepository = gameSessionRepository;
    this.storyService = storyService;
  }

  async sendRequest(userId, username) {
    const target = await this.userRepository.findByUsername(username);
    if (!target) throw new AppError('User not found', 404, 'NOT_FOUND');
    if (target.id === userId) throw new AppError('Cannot add yourself', 400, 'INVALID_INPUT');

    let alreadyFriends = false;
    try {
      alreadyFriends = await this.friendRepository.areFriends(userId, target.id);
    } catch (err) {
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    if (alreadyFriends) {
      return {
        status: 'friends',
        user: { id: target.id, username: target.username, avatar_url: target.avatar_url },
      };
    }

    // If they already requested you, accept immediately (nice UX).
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
      if (err?.code !== 'NOT_CONFIGURED') throw err;
    }

    let request = null;
    try {
      request = await this.friendRepository.createRequest({
        from_user_id: userId,
        to_user_id: target.id,
      });
    } catch (err) {
      if (err?.code === 'DUPLICATE') {
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

  async listRequests(userId) {
    let incoming = [];
    let outgoing = [];
    try {
      incoming = await this.friendRepository.listIncomingRequests(userId);
      outgoing = await this.friendRepository.listOutgoingRequests(userId);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') {
        return { incoming: [], outgoing: [] };
      }
      throw err;
    }

    const userIds = Array.from(
      new Set(
        [...incoming.map((r) => r.from_user_id), ...outgoing.map((r) => r.to_user_id)].filter(
          Boolean
        )
      )
    );

    const users = await this.userRepository.findByIds(userIds);
    const map = new Map(users.map((u) => [u.id, u]));

    return {
      incoming: incoming.map((r) => {
        const u = map.get(r.from_user_id);
        return {
          request_id: r.id,
          created_at: r.created_at,
          user: u ? { id: u.id, username: u.username, avatar_url: u.avatar_url } : null,
        };
      }),
      outgoing: outgoing.map((r) => {
        const u = map.get(r.to_user_id);
        return {
          request_id: r.id,
          created_at: r.created_at,
          user: u ? { id: u.id, username: u.username, avatar_url: u.avatar_url } : null,
        };
      }),
    };
  }

  async acceptRequest(userId, requestId) {
    const reqRow = await this.friendRepository.findRequestById(requestId);
    if (!reqRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (reqRow.to_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await this.friendRepository.createFriendshipPair(reqRow.from_user_id, reqRow.to_user_id);
    await this.friendRepository.deleteRequest(reqRow.id);

    const friend = await this.userRepository.findById(reqRow.from_user_id);
    return {
      success: true,
      friend: friend
        ? { id: friend.id, username: friend.username, avatar_url: friend.avatar_url }
        : null,
    };
  }

  async declineRequest(userId, requestId) {
    const reqRow = await this.friendRepository.findRequestById(requestId);
    if (!reqRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (reqRow.to_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await this.friendRepository.deleteRequest(reqRow.id);
    return { success: true };
  }

  async cancelRequest(userId, requestId) {
    const reqRow = await this.friendRepository.findRequestById(requestId);
    if (!reqRow) throw new AppError('Request not found', 404, 'NOT_FOUND');
    if (reqRow.from_user_id !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await this.friendRepository.deleteRequest(reqRow.id);
    return { success: true };
  }

  async listFriends(userId) {
    let friendIds = [];
    try {
      friendIds = await this.friendRepository.listFriendIdsForUser(userId);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') return [];
      throw err;
    }

    const users = await this.userRepository.findByIds(friendIds);
    return users.map((u) => ({ id: u.id, username: u.username, avatar_url: u.avatar_url }));
  }

  async getFriendProfile(userId, friendUserId) {
    let ok = false;
    ok = await this.friendRepository.areFriends(userId, friendUserId);
    if (!ok) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const friend = await this.userRepository.findById(friendUserId);
    if (!friend) throw new AppError('User not found', 404, 'NOT_FOUND');

    const [stats, sessions] = await Promise.all([
      this.userStatsRepository.findByUserId(friendUserId),
      this.gameSessionRepository.listByUserId(friendUserId, 500),
    ]);

    const mode_summary = buildModeSummary(sessions);

    let story_progress = null;
    try {
      story_progress = await this.storyService.getUserProgress(friendUserId);
    } catch {
      story_progress = null;
    }

    let scoreRows = [];
    try {
      scoreRows = await this.quizScoreRepository.listByUserId(friendUserId, 100);
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') {
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

    const quizIds = scoreRows.map((r) => r.quiz_id).filter(Boolean);
    const quizzes = await this.quizRepository.findByIds(quizIds);
    const quizMap = new Map(quizzes.map((q) => [q.id, q]));

    const custom_quiz_best = scoreRows
      .map((r) => {
        const q = quizMap.get(r.quiz_id);
        return {
          quiz_id: r.quiz_id,
          title: q?.title ?? null,
          visibility: q?.visibility ?? null,
          owner_user_id: q?.owner_user_id ?? null,
          best_score: r.best_score ?? 0,
          updated_at: r.updated_at ?? null,
        };
      })
      .filter((x) => {
        if (!x.title) return false;
        if (x.visibility !== 'private') return true;
        // Avoid leaking titles of third-party private quizzes.
        // Viewer can safely see:
        // - friend-owned private quizzes (friends-of-owner access)
        // - viewer-owned private quizzes
        return x.owner_user_id === friendUserId || x.owner_user_id === userId;
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
