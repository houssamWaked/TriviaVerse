/**
 * Blitz matchmaking service (async duels).
 */
import AppError from '../utils/AppError.js';

function asId(x) {
  return String(x || '').trim();
}

function isoNow() {
  return new Date().toISOString();
}

export class BlitzMatchmakingService {
  constructor({ queueRepository, duelRepository, sessionStartService }) {
    this.queueRepository = queueRepository;
    this.duelRepository = duelRepository;
    this.sessionStartService = sessionStartService;
  }

  async findOrQueue(userId, { difficulty, category_id = null }) {
    const uid = asId(userId);
    if (!uid) throw new AppError('Login required', 401, 'UNAUTHORIZED');

    const diff = String(difficulty || '')
      .trim()
      .toLowerCase();
    if (!diff) throw new AppError('Invalid difficulty', 400, 'INVALID_INPUT');

    const cid = category_id ? asId(category_id) : null;

    // If user already has an active request, reuse it.
    const existing = await this.queueRepository.findActiveByUserId(uid);
    if (existing) {
      return {
        status: existing.status,
        request_id: existing.id,
        duel_id: existing.duel_id || null,
      };
    }

    // Try to match someone already waiting (same difficulty + exact category match).
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
      if (!claimed) continue; // race: try again

      // Create a fixed blitz duel session snapshot for the waiting player (challenger).
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

      return {
        status: 'matched',
        duel_id: duel?.id || null,
        opponent_user_id: claimed.user_id,
      };
    }

    const created = await this.queueRepository.create({
      user_id: uid,
      category_id: cid,
      difficulty: diff,
    });

    return {
      status: 'queued',
      request_id: created?.id || null,
      duel_id: null,
    };
  }

  async getStatus(userId, requestId) {
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

  async cancel(userId, requestId) {
    const uid = asId(userId);
    const rid = asId(requestId);
    if (!uid) throw new AppError('Login required', 401, 'UNAUTHORIZED');
    if (!rid) throw new AppError('Invalid request_id', 400, 'INVALID_INPUT');

    const row = await this.queueRepository.cancel(rid, uid);
    if (!row) throw new AppError('Not found', 404, 'NOT_FOUND');
    return { success: true, status: row.status, request_id: row.id };
  }
}
