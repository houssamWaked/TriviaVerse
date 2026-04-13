/**
 * Blitz matchmaking queue repository (`blitz_matchmaking_queue` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QueueStatus = 'queued' | 'matching' | 'matched' | 'canceled';

type BlitzMatchmakingQueueRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  difficulty: string;
  status: QueueStatus;
  duel_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CreateQueueEntryInput = {
  user_id: string;
  category_id?: string | null;
  difficulty: string;
};

type FindCandidateInput = {
  excludeUserId: string;
  category_id?: string | null;
  difficulty: string;
  minCreatedAt?: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Blitz matchmaking is not configured. Apply `TriviaVerse/api/sql/010_blitz_matchmaking_queue.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '23505') {
    return new AppError('Already queued', 409, 'CONFLICT');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const normalizeId = (value: unknown): string => String(value || '').trim();
const normalizeDifficulty = (value: unknown): string => String(value || '').trim().toLowerCase();
const mapQueueRow = (row: unknown): BlitzMatchmakingQueueRow => row as unknown as BlitzMatchmakingQueueRow;

/**
 * Repository for blitz matchmaking queue entries (`blitz_matchmaking_queue`).
 */
export class BlitzMatchmakingQueueRepository {
  selectFields = 'id, user_id, category_id, difficulty, status, duel_id, created_at, updated_at';

  /**
   * Find a queue entry by id.
   * @param id Queue entry id.
   * @returns Queue row or `null`.
   */
  async findById(id: string): Promise<BlitzMatchmakingQueueRow | null> {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('id', normalizedId)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Find the most recent active queue entry for a user.
   * @param userId User id.
   * @returns Queue row or `null`.
   */
  async findActiveByUserId(userId: string): Promise<BlitzMatchmakingQueueRow | null> {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return null;
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('user_id', normalizedUserId)
      .in('status', ['queued', 'matching'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Create a new queue entry for a user.
   * @param user_id User id.
   * @param category_id Optional category id.
   * @param difficulty Difficulty label.
   * @returns Created queue row or `null`.
   */
  async create({ user_id, category_id = null, difficulty }: CreateQueueEntryInput): Promise<BlitzMatchmakingQueueRow | null> {
    const payload = {
      user_id,
      category_id: category_id ?? null,
      difficulty: normalizeDifficulty(difficulty),
      status: 'queued',
      duel_id: null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .insert(payload)
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Find a queued candidate matching the difficulty/category, excluding the given user.
   * @param excludeUserId User id to exclude.
   * @param category_id Optional category id (null matches null).
   * @param difficulty Difficulty label.
   * @param minCreatedAt Optional minimum created timestamp.
   * @returns Candidate queue row or `null`.
   */
  async findCandidate({
    excludeUserId,
    category_id = null,
    difficulty,
    minCreatedAt = null,
  }: FindCandidateInput): Promise<BlitzMatchmakingQueueRow | null> {
    const query = supabase
      .from('blitz_matchmaking_queue')
      .select(this.selectFields)
      .eq('status', 'queued')
      .eq('difficulty', normalizeDifficulty(difficulty))
      .neq('user_id', normalizeId(excludeUserId))
      .order('created_at', { ascending: true })
      .limit(1);

    if (category_id) query.eq('category_id', normalizeId(category_id));
    else query.is('category_id', null);

    if (minCreatedAt) query.gte('created_at', String(minCreatedAt));

    const { data, error } = await query;
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Atomically claim a queued entry by switching it to `matching`.
   * @param id Queue entry id.
   * @returns Updated queue row or `null` if not claimable.
   */
  async claimMatching(id: string): Promise<BlitzMatchmakingQueueRow | null> {
    const normalizedId = normalizeId(id);
    if (!normalizedId) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'matching', updated_at: now })
      .eq('id', normalizedId)
      .eq('status', 'queued')
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Mark an entry as matched and attach the duel id.
   * @param id Queue entry id.
   * @param duelId Duel id.
   * @returns Updated queue row or `null`.
   */
  async markMatched(id: string, duelId: string): Promise<BlitzMatchmakingQueueRow | null> {
    const normalizedId = normalizeId(id);
    const normalizedDuelId = normalizeId(duelId);
    if (!normalizedId) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'matched', duel_id: normalizedDuelId || null, updated_at: now })
      .eq('id', normalizedId)
      .in('status', ['queued', 'matching'])
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }

  /**
   * Cancel a queued/matching entry for a user.
   * @param id Queue entry id.
   * @param userId User id.
   * @returns Updated queue row or `null`.
   */
  async cancel(id: string, userId: string): Promise<BlitzMatchmakingQueueRow | null> {
    const normalizedId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!normalizedId || !normalizedUserId) return null;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blitz_matchmaking_queue')
      .update({ status: 'canceled', updated_at: now })
      .eq('id', normalizedId)
      .eq('user_id', normalizedUserId)
      .in('status', ['queued', 'matching'])
      .select(this.selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapQueueRow(data[0]) : null;
  }
}
