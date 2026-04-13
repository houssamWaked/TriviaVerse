/**
 * Blitz matchmaking service (async duels).
 */
import AppError from '../utils/AppError.js';

type QueueRowLike = {
  id: string;
  user_id: string;
  category_id: string | null;
  difficulty: string;
  status: string;
  duel_id: string | null;
};

type QueueRepositoryLike = {
  findActiveByUserId(userId: string): Promise<QueueRowLike | null>;
  findCandidate(input: {
    excludeUserId: string;
    difficulty: string;
    category_id: string | null;
    minCreatedAt: string;
  }): Promise<QueueRowLike | null>;
  claimMatching(queueId: string): Promise<QueueRowLike | null>;
  create(input: {
    user_id: string;
    category_id: string | null;
    difficulty: string;
  }): Promise<QueueRowLike | null>;
  findById(requestId: string): Promise<QueueRowLike | null>;
  cancel(requestId: string, userId: string): Promise<QueueRowLike | null>;
  markMatched(queueId: string, duelId: string | null): Promise<QueueRowLike | null>;
};

type DuelLike = { id?: string | null };

type DuelRepositoryLike = {
  create(payload: Record<string, unknown>): Promise<DuelLike | null>;
};

type SessionStartLike = {
  session_id: string;
};

type SessionStartServiceLike = {
  startBlitzDuelSession(
    userId: string,
    input: { category_id: string | null; difficulty: string; total_questions: number }
  ): Promise<SessionStartLike>;
};

type FindOrQueueInput = {
  difficulty: string;
  category_id?: string | null;
};

const asId = (value: unknown): string => String(value || '').trim();
const isoNow = (): string => new Date().toISOString();

export class BlitzMatchmakingService {
  queueRepository: QueueRepositoryLike;
  duelRepository: DuelRepositoryLike;
  sessionStartService: SessionStartServiceLike;

  /**
   * Construct the blitz matchmaking service.
   * @param queueRepository Matchmaking queue persistence.
   * @param duelRepository Duel creation for matched users.
   * @param sessionStartService Session snapshot creation for blitz duels.
   * @returns A `BlitzMatchmakingService` instance.
   */
  constructor({
    queueRepository,
    duelRepository,
    sessionStartService,
  }: {
    queueRepository: QueueRepositoryLike;
    duelRepository: DuelRepositoryLike;
    sessionStartService: SessionStartServiceLike;
  }) {
    this.queueRepository = queueRepository;
    this.duelRepository = duelRepository;
    this.sessionStartService = sessionStartService;
  }

  /**
   * Try to find a queued opponent or enqueue the user for matchmaking.
   * @param userId Current user id.
   * @param difficulty Difficulty label.
   * @param category_id Optional category id (null means any/none depending on queue).
   * @returns Matchmaking status payload (queued/matched) with ids.
   */
  async findOrQueue(userId: string, { difficulty, category_id = null }: FindOrQueueInput) {
    const uid = asId(userId);
    if (!uid) throw new AppError('Login required', 401, 'UNAUTHORIZED');

    const diff = String(difficulty || '').trim().toLowerCase();
    if (!diff) throw new AppError('Invalid difficulty', 400, 'INVALID_INPUT');
    const cid = category_id ? asId(category_id) : null;

    const existing = await this.queueRepository.findActiveByUserId(uid);
    if (existing) {
      return { status: existing.status, request_id: existing.id, duel_id: existing.duel_id || null };
    }

    const minCreatedAt = new Date(Date.now() - 10 * 60_000).toISOString();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const candidate = await this.queueRepository.findCandidate({
        excludeUserId: uid,
        difficulty: diff,
        category_id: cid,
        minCreatedAt,
      });
      if (!candidate) break;

      const claimed = await this.queueRepository.claimMatching(candidate.id);
      if (!claimed) continue;

      const start = await this.sessionStartService.startBlitzDuelSession(claimed.user_id, {
        category_id: claimed.category_id ?? null,
        difficulty: claimed.difficulty ?? diff,
        total_questions: 20,
      });

      const started_at = new Date(Date.now() + 3000).toISOString();
      const duel = await this.duelRepository.create({
        mode: 'blitz',
        quiz_id: null,
        category_id: claimed.category_id ?? null,
        difficulty: claimed.difficulty ?? diff,
        challenger_user_id: claimed.user_id,
        opponent_user_id: uid,
        challenger_session_id: start.session_id,
        opponent_session_id: null,
        status: 'active',
        winner_user_id: null,
        started_at,
        current_index: 1,
        question_started_at: null,
        challenger_points: 0,
        opponent_points: 0,
        accepted_at: isoNow(),
        completed_at: null,
        summary_json: {},
      });

      await this.queueRepository.markMatched(claimed.id, duel?.id || null);
      return { status: 'matched', duel_id: duel?.id || null, opponent_user_id: claimed.user_id };
    }

    const created = await this.queueRepository.create({
      user_id: uid,
      category_id: cid,
      difficulty: diff,
    });
    return { status: 'queued', request_id: created?.id || null, duel_id: null };
  }

  /**
   * Get a user's matchmaking request status.
   * @param userId Current user id.
   * @param requestId Queue request id.
   * @returns Status payload including duel id when matched.
   */
  async getStatus(userId: string, requestId: string) {
    const uid = asId(userId);
    const rid = asId(requestId);
    if (!uid) throw new AppError('Login required', 401, 'UNAUTHORIZED');
    if (!rid) throw new AppError('Invalid request_id', 400, 'INVALID_INPUT');

    const row = await this.queueRepository.findById(rid);
    if (!row) throw new AppError('Not found', 404, 'NOT_FOUND');
    if (String(row.user_id) !== uid) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    return {
      status: row.status,
      request_id: row.id,
      duel_id: row.duel_id || null,
      difficulty: row.difficulty,
      category_id: row.category_id,
    };
  }

  /**
   * Cancel an active matchmaking request for a user.
   * @param userId Current user id.
   * @param requestId Queue request id.
   * @returns `{ success, status, request_id }`.
   */
  async cancel(userId: string, requestId: string) {
    const uid = asId(userId);
    const rid = asId(requestId);
    if (!uid) throw new AppError('Login required', 401, 'UNAUTHORIZED');
    if (!rid) throw new AppError('Invalid request_id', 400, 'INVALID_INPUT');

    const row = await this.queueRepository.cancel(rid, uid);
    if (!row) throw new AppError('Not found', 404, 'NOT_FOUND');
    return { success: true, status: row.status, request_id: row.id };
  }
}
