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

  constructor(quizDiscoveryService: QuizDiscoveryServiceLike) {
    this.quizDiscoveryService = quizDiscoveryService;
  }

  top = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.top({
      userId: req.user?.id || null,
      limit: getQueryValue(req.query.limit),
    });
    res.status(200).json(data);
  };

  search = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.search({
      q: getQueryValue(req.query.q),
      limit: getQueryValue(req.query.limit),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  getQuiz = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getQuizDetails({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  ratings = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getRatingsSummary({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
    });
    res.status(200).json(data);
  };

  leaderboard = async (req: Request, res: Response) => {
    const data = await this.quizDiscoveryService.getCustomQuizLeaderboard({
      quizId: getParam(req.params.quiz_id),
      userId: req.user?.id || null,
      limit: getQueryValue(req.query.limit),
    });
    res.status(200).json(data);
  };
}
