/**
 * Quiz question repository (`quiz_questions` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizQuestionRow = {
  id: string;
  quiz_id: string | null;
  question_text: string;
  explanation: string | null;
  time_limit_sec: number | null;
  points: number | null;
  order_index: number | null;
  difficulty_rating?: number | null;
  is_assigned?: boolean | null;
};

type CreateQuizQuestionInput = Omit<QuizQuestionRow, 'id'> & { id?: string };
type UpdateQuizQuestionInput = Partial<Omit<QuizQuestionRow, 'id'>>;
type DifficultyRange = { min?: number; max?: number };
type ListGlobalInput = { q?: string; limit?: number; offset?: number; assigned?: string };
type QueryResult<T> = { data: T[] | null; error: DatabaseErrorLike };
type QueryRunner = (fields: string) => any;

const SELECT_FIELDS_BASE =
  'id, quiz_id, question_text, explanation, time_limit_sec, points, order_index';
const SELECT_FIELDS_DIFFICULTY = `${SELECT_FIELDS_BASE}, difficulty_rating`;
const SELECT_FIELDS_ASSIGNED = `${SELECT_FIELDS_BASE}, is_assigned`;
const SELECT_FIELDS_FULL = `${SELECT_FIELDS_BASE}, difficulty_rating, is_assigned`;

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42703') {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('difficulty_rating')) {
      return new AppError('Quiz question difficulty rating column is not configured', 501, 'NOT_CONFIGURED');
    }
    if (msg.includes('is_assigned')) {
      return new AppError(
        'Quiz question assignment flag is not configured. Apply `TriviaVerse/api/sql/008_quiz_questions_is_assigned.sql`.',
        501,
        'NOT_CONFIGURED'
      );
    }
    return new AppError('Quiz questions schema is missing expected columns', 501, 'NOT_CONFIGURED');
  }
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

async function selectWithFallback(run: QueryRunner): Promise<QueryResult<QuizQuestionRow>> {
  let res = (await run(SELECT_FIELDS_FULL)) as QueryResult<QuizQuestionRow>;
  if (res?.error && String(res.error.code || '').trim() === '42703') {
    const msg = String(res.error.message || '').toLowerCase();
    if (msg.includes('is_assigned')) {
      res = (await run(SELECT_FIELDS_DIFFICULTY)) as QueryResult<QuizQuestionRow>;
    } else if (msg.includes('difficulty_rating')) {
      res = (await run(SELECT_FIELDS_ASSIGNED)) as QueryResult<QuizQuestionRow>;
    } else {
      res = (await run(SELECT_FIELDS_BASE)) as QueryResult<QuizQuestionRow>;
    }
  }
  if (res?.error && String(res.error.code || '').trim() === '42703') {
    res = (await run(SELECT_FIELDS_BASE)) as QueryResult<QuizQuestionRow>;
  }
  return res;
}

const mapQuestionRow = (row: unknown): QuizQuestionRow => row as unknown as QuizQuestionRow;

/**
 * Repository for reading/writing `quiz_questions` rows (with schema fallbacks for optional columns).
 */
export class QuizQuestionRepository {
  /**
   * Count all quiz questions.
   * @returns Total row count.
   */
  async countAll(): Promise<number> {
    const { count, error } = await supabase.from('quiz_questions').select('*', { count: 'exact', head: true });
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  /**
   * Count questions for a quiz.
   * @param quizId Quiz id.
   * @returns Count of questions for the quiz.
   */
  async countByQuizId(quizId: string): Promise<number> {
    const id = String(quizId || '').trim();
    if (!id) return 0;
    const { count, error } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', id);
    if (error) throw toAppError(error);
    return count ?? 0;
  }

  /**
   * List questions for a quiz ordered by `order_index`.
   * @param quizId Quiz id.
   * @returns Array of question rows.
   */
  async listByQuizId(quizId: string): Promise<QuizQuestionRow[]> {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).eq('quiz_id', quizId).order('order_index', { ascending: true })
    );
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuestionRow);
  }

  /**
   * Find a question by id.
   * @param id Question id.
   * @returns Question row or `null`.
   */
  async findById(id: string): Promise<QuizQuestionRow | null> {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).eq('id', id).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapQuestionRow(res.data[0]) : null;
  }

  /**
   * Create a question row.
   * @param payload Insert payload.
   * @returns Created question row or `null`.
   */
  async create(payload: CreateQuizQuestionInput): Promise<QuizQuestionRow | null> {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').insert(payload).select(fields).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapQuestionRow(res.data[0]) : null;
  }

  /**
   * Patch a question row by id.
   * @param id Question id.
   * @param patch Patch payload.
   * @returns Updated question row or `null`.
   */
  async update(id: string, patch: UpdateQuizQuestionInput): Promise<QuizQuestionRow | null> {
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').update(patch).eq('id', id).select(fields).limit(1)
    );
    if (res.error) throw toAppError(res.error);
    return res.data?.[0] ? mapQuestionRow(res.data[0]) : null;
  }

  /**
   * Delete a question by id.
   * @param id Question id.
   * @returns `true` if a row was deleted.
   */
  async delete(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('quiz_questions').delete({ count: 'exact' }).eq('id', id);
    if (error) throw toAppError(error);
    return (count ?? 0) > 0;
  }

  /**
   * List a random set of questions (any quiz/global).
   * @param limit Number of questions requested.
   * @returns Array of question rows.
   */
  async listRandom(limit: number): Promise<QuizQuestionRow[]> {
    const cap = Math.min(200, Math.max(1, limit * 5));
    const res = await selectWithFallback((fields) => supabase.from('quiz_questions').select(fields).limit(cap));
    if (res.error) throw toAppError(res.error);
    const rows = [...(res.data || [])].map(mapQuestionRow);
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(limit, rows.length));
  }

  /**
   * List a random set of global questions (`quiz_id` is null).
   * @param limit Number of questions requested.
   * @returns Array of global question rows.
   */
  async listRandomGlobal(limit: number): Promise<QuizQuestionRow[]> {
    const cap = Math.min(200, Math.max(1, limit * 5));
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).is('quiz_id', null).limit(cap)
    );
    if (res.error) throw toAppError(res.error);
    const rows = [...(res.data || [])].map(mapQuestionRow);
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(limit, rows.length));
  }

  /**
   * List a random set of global questions constrained by difficulty rating.
   * @param limit Number of questions requested.
   * @param min Minimum difficulty rating.
   * @param max Maximum difficulty rating.
   * @returns Array of global question rows.
   */
  async listRandomGlobalByDifficultyRange(
    limit: number,
    { min = 1, max = 10 }: DifficultyRange = {}
  ): Promise<QuizQuestionRow[]> {
    const lim = Math.max(1, Number(limit) || 1);
    const dmin = Math.min(10, Math.max(1, Number(min) || 1));
    const dmax = Math.min(10, Math.max(dmin, Number(max) || dmin));
    const cap = Math.min(500, Math.max(10, lim * 20));
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(SELECT_FIELDS_BASE)
      .is('quiz_id', null)
      .gte('difficulty_rating', dmin)
      .lte('difficulty_rating', dmax)
      .limit(cap);
    if (error) throw toAppError(error);
    const rows = [...(data || [])].map(mapQuestionRow);
    for (let i = rows.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    return rows.slice(0, Math.min(lim, rows.length));
  }

  /**
   * List questions by ids.
   * @param ids Question ids.
   * @returns Array of question rows.
   */
  async listByIds(ids: string[] = []): Promise<QuizQuestionRow[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];
    const res = await selectWithFallback((fields) =>
      supabase.from('quiz_questions').select(fields).in('id', unique)
    );
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuestionRow);
  }

  /**
   * List global questions with optional search/pagination/assignment filtering.
   * @param q Optional search text.
   * @param limit Page size.
   * @param offset Page offset.
   * @param assigned `all` | `assigned` | `unassigned` (best-effort based on schema).
   * @returns Array of global question rows.
   */
  async listGlobal({ q = '', limit = 20, offset = 0, assigned = 'all' }: ListGlobalInput = {}): Promise<QuizQuestionRow[]> {
    const query = String(q || '').trim();
    const lim = Math.min(50, Math.max(1, Number(limit) || 20));
    const off = Math.max(0, Number(offset) || 0);
    const assignment = String(assigned || 'all').trim().toLowerCase();

    let res = await selectWithFallback((fields) => {
      let req = supabase.from('quiz_questions').select(fields).is('quiz_id', null);
      if (query) req = req.ilike('question_text', `%${query}%`);
      if (assignment === 'assigned') req = req.eq('is_assigned', true);
      if (assignment === 'unassigned') req = req.eq('is_assigned', false);
      return req.order('question_text', { ascending: true }).order('id', { ascending: true }).range(off, off + lim - 1);
    });

    if (res?.error && String(res.error.code || '').trim() === '42703') {
      const msg = String(res.error.message || '').toLowerCase();
      if (msg.includes('is_assigned')) {
        res = await selectWithFallback((fields) => {
          let req = supabase.from('quiz_questions').select(fields).is('quiz_id', null);
          if (query) req = req.ilike('question_text', `%${query}%`);
          return req.order('question_text', { ascending: true }).order('id', { ascending: true }).range(off, off + lim - 1);
        });
      }
    }
    if (res.error) throw toAppError(res.error);
    return (res.data || []).map(mapQuestionRow);
  }

  /**
   * Delete all questions for a quiz.
   * @param quizId Quiz id.
   * @returns `true` on success.
   */
  async deleteByQuizId(quizId: string): Promise<true> {
    const { error } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return true;
  }
}
