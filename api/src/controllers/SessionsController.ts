/**
 * Shared session gameplay controller.
 */
import type { Request, Response } from 'express';

type SessionServiceLike = {
  getCurrent(sessionId: string, userId: string | null): Promise<unknown>;
  getReview(sessionId: string, userId: string | null): Promise<unknown>;
  submitAnswer(sessionId: string, userId: string | null, body: unknown): Promise<unknown>;
  useLifeline(sessionId: string, userId: string | null, body: unknown): Promise<unknown>;
  finish(sessionId: string, userId: string | null, status: unknown): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export class SessionsController {
  sessionService: SessionServiceLike;

  constructor(sessionService: SessionServiceLike) {
    this.sessionService = sessionService;
  }

  current = async (req: Request, res: Response) => {
    const data = await this.sessionService.getCurrent(
      getParam(req.params.session_id),
      req.user?.id || null
    );
    res.status(200).json(data);
  };

  review = async (req: Request, res: Response) => {
    const data = await this.sessionService.getReview(
      getParam(req.params.session_id),
      req.user?.id || null
    );
    res.status(200).json(data);
  };

  answer = async (req: Request, res: Response) => {
    const data = await this.sessionService.submitAnswer(
      getParam(req.params.session_id),
      req.user?.id || null,
      req.body
    );
    res.status(200).json(data);
  };

  useLifeline = async (req: Request, res: Response) => {
    const data = await this.sessionService.useLifeline(
      getParam(req.params.session_id),
      req.user?.id || null,
      req.body
    );
    res.status(200).json(data);
  };

  finish = async (req: Request, res: Response) => {
    const data = await this.sessionService.finish(
      getParam(req.params.session_id),
      req.user?.id || null,
      req.body.status
    );
    res.status(200).json(data);
  };
}
