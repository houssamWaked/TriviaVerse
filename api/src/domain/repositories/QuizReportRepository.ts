/**
 * Quiz reports repository (`quiz_reports` table).
 */
import { supabase } from '../../config/supabase.js';
import AppError from '../../utils/AppError.js';

type DatabaseErrorLike = {
  message?: string;
  code?: string;
} | null;

type QuizReportStatus = 'open' | 'resolved' | string;

type QuizReportRow = {
  id: string;
  quiz_id: string;
  reporter_user_id: string;
  reason: string;
  message: string | null;
  status: QuizReportStatus;
  created_at: string | null;
  updated_at: string | null;
  resolved_at?: string | null;
  resolved_by_admin_email?: string | null;
};

type UpsertOpenReportInput = {
  quiz_id: string;
  reporter_user_id: string;
  reason?: string;
  message?: string | null;
};

type ListReportsInput = {
  status?: string;
  limit?: number;
  offset?: number;
};

type ResolveReportInput = {
  adminEmail?: string | null;
};

function toAppError(error: DatabaseErrorLike): AppError | null {
  if (!error) return null;
  const code = String(error.code || '').trim();
  if (code === '42P01') {
    return new AppError(
      'Quiz reports are not configured. Apply `TriviaVerse/api/sql/005_quiz_reports_and_bans.sql`.',
      501,
      'NOT_CONFIGURED'
    );
  }
  if (code === '23505') return new AppError('Report already exists', 409, 'DUPLICATE');
  return new AppError(error.message || 'Database error', 500, 'DB_ERROR');
}

const selectFields =
  'id, quiz_id, reporter_user_id, reason, message, status, created_at, updated_at, resolved_at, resolved_by_admin_email';
const mapReportRow = (row: unknown): QuizReportRow => row as unknown as QuizReportRow;

export class QuizReportRepository {
  async upsertOpen({
    quiz_id,
    reporter_user_id,
    reason = 'other',
    message = null,
  }: UpsertOpenReportInput): Promise<QuizReportRow | null> {
    const now = new Date().toISOString();
    const payload = {
      quiz_id,
      reporter_user_id,
      reason: String(reason || 'other').trim().slice(0, 60) || 'other',
      message: message != null ? String(message).trim().slice(0, 2000) : null,
      status: 'open',
      updated_at: now,
      resolved_at: null,
      resolved_by_admin_email: null,
    };

    const { data, error } = await supabase.from('quiz_reports').upsert(payload, { onConflict: 'quiz_id,reporter_user_id' }).select(selectFields).limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapReportRow(data[0]) : null;
  }

  async list({ status = 'open', limit = 50, offset = 0 }: ListReportsInput = {}): Promise<QuizReportRow[]> {
    const normalizedStatus = String(status || 'open').trim();
    const lim = Math.min(200, Math.max(1, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);
    const { data, error } = await supabase
      .from('quiz_reports')
      .select(selectFields)
      .eq('status', normalizedStatus)
      .order('created_at', { ascending: false })
      .range(off, off + lim - 1);
    if (error) throw toAppError(error);
    return (data || []).map(mapReportRow);
  }

  async resolve(reportId: string, { adminEmail = null }: ResolveReportInput = {}): Promise<QuizReportRow | null> {
    const now = new Date().toISOString();
    const patch = {
      status: 'resolved',
      resolved_at: now,
      resolved_by_admin_email: adminEmail ? String(adminEmail).trim().toLowerCase() : null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('quiz_reports')
      .update(patch)
      .eq('id', reportId)
      .select(selectFields)
      .limit(1);
    if (error) throw toAppError(error);
    return data?.[0] ? mapReportRow(data[0]) : null;
  }

  async deleteByQuizId(quizId: string): Promise<{ success: true }> {
    const { error } = await supabase.from('quiz_reports').delete().eq('quiz_id', quizId);
    if (error) throw toAppError(error);
    return { success: true };
  }
}
