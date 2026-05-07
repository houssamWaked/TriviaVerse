import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthTokenService } from '../auth/auth-token.service';
import { DatabaseService } from '../database/database.service';

type QuizRow = {
  id: string;
  owner_user_id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  visibility: string;
  status: string;
  created_at?: string | null;
  published_at?: string | null;
};

@Injectable()
export class QuizService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokens: AuthTokenService,
  ) {}

  async searchQuizzes(q: string, limit = 30) {
    const query = String(q || '').trim();
    const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 30));
    if (!query) return { q: query, results: [] };

    const { data, error } = await this.db.supabase
      .from('quizzes')
      .select(this.quizFields)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(normalizedLimit);

    if (error) this.throwDbError(error.message);
    return { q: query, results: await this.decorateQuizzes(((data || []) as unknown) as QuizRow[]) };
  }

  async getTopQuizzes(limit = 20) {
    const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const { data, error } = await this.db.supabase
      .from('quizzes')
      .select(this.quizFields)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(normalizedLimit);

    if (error) this.throwDbError(error.message);
    const decorated = await this.decorateQuizzes(((data || []) as unknown) as QuizRow[]);
    return { results: this.sortQuizCards(decorated).slice(0, normalizedLimit) };
  }

  async getPublicQuiz(quizId: string) {
    const quiz = await this.findVisibleQuiz(quizId);
    const [decorated] = await this.decorateQuizzes([quiz]);
    const questionsCount = await this.countQuizQuestions(quizId);

    return {
      quiz: decorated,
      questions_count: questionsCount,
      can_edit: false,
    };
  }

  async getRatingsSummary(quizId: string) {
    await this.findVisibleQuiz(quizId);
    return this.getRatings(quizId);
  }

  async getQuizLeaderboard(quizId: string, limit = 20) {
    await this.findVisibleQuiz(quizId);
    const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const { data, error } = await this.db.supabase
      .from('quiz_scores')
      .select('quiz_id, user_id, best_score, updated_at')
      .eq('quiz_id', quizId)
      .order('best_score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(normalizedLimit);

    if (error) {
      const code = String(error.code || '').trim();
      if (code === '42P01') return { quiz_id: quizId, entries: [], not_configured: true };
      this.throwDbError(error.message);
    }

    const rows = data || [];
    const users = await this.listUsers(rows.map((row: any) => row.user_id));
    const userMap = new Map(users.map((user: any) => [user.id, user]));

    return {
      quiz_id: quizId,
      my_best_score: null,
      entries: rows.map((row: any, index: number) => {
        const user = userMap.get(row.user_id);
        return {
          rank_position: index + 1,
          user_id: row.user_id,
          username: user?.username ?? null,
          avatar_url: user?.avatar_url ?? null,
          best_score: Number(row.best_score || 0),
          updated_at: row.updated_at ?? null,
        };
      }),
    };
  }

  async rateQuiz(req: any, quizId: string, rating: number) {
    const authUser = this.tokens.requireUserFromRequest(req);
    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    await this.findVisibleQuiz(quizId);
    const { error } = await this.db.supabase
      .from('quiz_ratings')
      .upsert(
        {
          quiz_id: quizId,
          user_id: authUser.id,
          rating: normalizedRating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'quiz_id,user_id' },
      );

    if (error) this.throwDbError(error.message);
    const summary = await this.getRatings(quizId);
    return { ...summary, my_rating: normalizedRating };
  }

  private get quizFields() {
    return 'id, owner_user_id, title, description, cover_image_url, visibility, status, created_at, published_at';
  }

  private async findVisibleQuiz(quizId: string): Promise<QuizRow> {
    const { data, error } = await this.db.supabase
      .from('quizzes')
      .select(this.quizFields)
      .eq('id', quizId)
      .limit(1);

    if (error) this.throwDbError(error.message);
    const quiz = (data?.[0] as unknown) as QuizRow | undefined;
    if (!quiz || quiz.status !== 'published') throw new NotFoundException('Quiz not found');
    if (quiz.visibility === 'private') throw new UnauthorizedException('Login required');
    if (!['public', 'unlisted'].includes(quiz.visibility)) throw new ForbiddenException('Forbidden');
    return quiz;
  }

  private async decorateQuizzes(rows: QuizRow[]) {
    const quizIds = rows.map((quiz) => quiz.id);
    const ownerIds = rows.map((quiz) => quiz.owner_user_id).filter(Boolean);
    const [users, ratings, playedCounts] = await Promise.all([
      this.listUsers(ownerIds),
      this.listRatingsByQuizIds(quizIds),
      this.countPlayersByQuizIds(quizIds),
    ]);

    const userMap = new Map(users.map((user: any) => [user.id, user]));
    const ratingsMap = this.computeRatingsMap(ratings);

    return rows.map((quiz) => {
      const owner = userMap.get(quiz.owner_user_id);
      const rating = ratingsMap.get(quiz.id) || { ratings_avg: 0, ratings_count: 0 };
      return {
        ...quiz,
        owner: owner
          ? { id: owner.id, username: owner.username, avatar_url: owner.avatar_url ?? null }
          : null,
        ratings_avg: rating.ratings_avg,
        ratings_count: rating.ratings_count,
        played_count: playedCounts.get(quiz.id) || 0,
      };
    });
  }

  private async listUsers(userIds: string[]) {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await this.db.supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', ids);

    if (error) this.throwDbError(error.message);
    return data || [];
  }

  private async listRatingsByQuizIds(quizIds: string[]) {
    const ids = Array.from(new Set(quizIds.filter(Boolean)));
    if (ids.length === 0) return [];

    const { data, error } = await this.db.supabase
      .from('quiz_ratings')
      .select('quiz_id, rating')
      .in('quiz_id', ids);

    if (error) {
      if (String(error.code || '').trim() === '42P01') return [];
      this.throwDbError(error.message);
    }
    return data || [];
  }

  private async getRatings(quizId: string) {
    const { data, error } = await this.db.supabase
      .from('quiz_ratings')
      .select('quiz_id, rating')
      .eq('quiz_id', quizId);

    if (error) {
      if (String(error.code || '').trim() === '42P01') {
        return { ratings_avg: 0, ratings_count: 0, my_rating: null };
      }
      this.throwDbError(error.message);
    }

    const rows = data || [];
    const sum = rows.reduce((acc: number, row: any) => acc + (Number(row.rating) || 0), 0);
    const count = rows.length;
    return {
      ratings_avg: count ? Math.round((sum / count) * 100) / 100 : 0,
      ratings_count: count,
      my_rating: null,
    };
  }

  private async countPlayersByQuizIds(quizIds: string[]) {
    const ids = Array.from(new Set(quizIds.filter(Boolean)));
    const counts = new Map<string, number>();
    if (ids.length === 0) return counts;

    const { data, error } = await this.db.supabase
      .from('quiz_scores')
      .select('quiz_id')
      .in('quiz_id', ids);

    if (error) {
      if (String(error.code || '').trim() === '42P01') return counts;
      this.throwDbError(error.message);
    }

    for (const row of data || []) {
      const id = (row as any).quiz_id;
      if (id) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }

  private async countQuizQuestions(quizId: string) {
    const { count, error } = await this.db.supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);

    if (error) this.throwDbError(error.message);
    return count || 0;
  }

  private computeRatingsMap(rows: any[]) {
    const raw = new Map<string, { sum: number; count: number }>();
    for (const row of rows) {
      const quizId = row.quiz_id;
      if (!quizId) continue;
      const next = raw.get(quizId) || { sum: 0, count: 0 };
      next.sum += Number(row.rating) || 0;
      next.count += 1;
      raw.set(quizId, next);
    }

    const result = new Map<string, { ratings_avg: number; ratings_count: number }>();
    for (const [quizId, value] of raw.entries()) {
      result.set(quizId, {
        ratings_avg: value.count ? Math.round((value.sum / value.count) * 100) / 100 : 0,
        ratings_count: value.count,
      });
    }
    return result;
  }

  private sortQuizCards(rows: any[]) {
    return [...rows].sort((a, b) => {
      if ((b.played_count || 0) !== (a.played_count || 0)) {
        return (b.played_count || 0) - (a.played_count || 0);
      }
      if ((b.ratings_avg || 0) !== (a.ratings_avg || 0)) {
        return (b.ratings_avg || 0) - (a.ratings_avg || 0);
      }
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    });
  }

  private throwDbError(message: string): never {
    throw new InternalServerErrorException(message || 'Database error');
  }
}
