/**
 * Quiz discovery controller.
 */
import type { Request, Response } from 'express';

type QuizDiscoveryOptions = {
  userId: string | null;
  limit?: string;
  q?: string;
  quizId?: string;
};

type QuizDiscoveryServiceLike = {
  top(options: QuizDiscoveryOptions): Promise<unknown>;
  search(options: QuizDiscoveryOptions): Promise<unknown>;
  getQuizDetails(options: QuizDiscoveryOptions): Promise<unknown>;
  getRatingsSummary(options: QuizDiscoveryOptions): Promise<unknown>;
  getCustomQuizLeaderboard(options: QuizDiscoveryOptions): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

const getQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
};

export class QuizDiscoveryController {
  quizDiscoveryService: QuizDiscoveryServiceLike;

  /**
   * Construct the quiz discovery controller.
   * @param quizDiscoveryService Service for public quiz search/top/details.
   * @returns A `QuizDiscoveryController` instance.
   */
  constructor(quizDiscoveryService: QuizDiscoveryServiceLike) {
    this.quizDiscoveryService = quizDiscoveryService;
  }

  /**
   * Get top quizzes (visibility filtered by auth state).
   * @param req Express request (uses `req.user?.id` and `req.query.limit`).
   * @param res Express response.
   * @returns A 200 response with top quiz results.
   */
  top = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.top({
      userId: req.user?.id || null,
      limit: getQueryValue(req.query.limit),
    });
    res.status(200).json(data);
  };

  /**
   * Search quizzes by text query (visibility filtered by auth state).
   * @param req Express request (uses `req.query.q` and `req.query.limit`).
   * @param res Express response.
   * @returns A 200 response with search results.
   */
  search = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.search({
      q: getQueryValue(req.query.q),
      limit: getQueryValue(req.query.limit),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  /**
   * Get quiz details payload for a quiz id.
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with quiz details.
   */
  getQuiz = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getQuizDetails({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  /**
   * Get ratings summary for a quiz id.
   * @param req Express request (expects `:quiz_id`).
   * @param res Express response.
   * @returns A 200 response with ratings summary.
   */
  ratings = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getRatingsSummary({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  /**
   * Get the custom quiz leaderboard for a quiz id.
   * @param req Express request (expects `:quiz_id` and optional `?limit=`).
   * @param res Express response.
   * @returns A 200 response with leaderboard entries.
   */
  leaderboard = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getCustomQuizLeaderboard({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
      limit: getQueryValue(req.query.limit),
    });
    res.status(200).json(data);
  };
}
