/**
 * Shared session gameplay controller.
 */
import type { Request, Response } from 'express';
import { emitSessionChanged } from '../socket.js';

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

// HTTP adapter for session gameplay (current question, answering, lifelines, finishing).
export class SessionsController {
  sessionService: SessionServiceLike;

  /**
   * Construct a controller that delegates to the session service.
   * @param sessionService Domain service implementing session gameplay operations.
   * @returns A `SessionsController` instance.
   */
  constructor(sessionService: SessionServiceLike) {
    this.sessionService = sessionService;
  }

  /**
   * Get the currently active question/state for a session.
   * @param req Express request (expects `:session_id` route param).
   * @param res Express response.
   * @returns A 200 response with the current question payload.
   */
  current = async (req: Request, res: Response) => {
    const data = await this.sessionService.getCurrent(
      getParam(req.params.session_id),
      req.user?.id || null
    );
    res.status(200).json(data);
  };

  /**
   * Get a review payload for a completed session (correct/incorrect answers).
   * @param req Express request (expects `:session_id` route param).
   * @param res Express response.
   * @returns A 200 response with review data.
   */
  review = async (req: Request, res: Response) => {
    const data = await this.sessionService.getReview(
      getParam(req.params.session_id),
      req.user?.id || null
    );
    res.status(200).json(data);
  };

  /**
   * Submit an answer for the current question and notify the user via sockets.
   * @param req Express request (expects `:session_id` and answer payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with answer result (and next question when available).
   */
  answer = async (req: Request, res: Response) => {
    const sessionId = getParam(req.params.session_id);
    const userId = req.user?.id || null;
    const data = await this.sessionService.submitAnswer(
      sessionId,
      userId,
      req.body
    );
    emitSessionChanged('answered', sessionId, userId);
    res.status(200).json(data);
  };

  /**
   * Use a lifeline for a session question and notify the user via sockets.
   * @param req Express request (expects `:session_id` and lifeline payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with lifeline outcome.
   */
  useLifeline = async (req: Request, res: Response) => {
    const sessionId = getParam(req.params.session_id);
    const userId = req.user?.id || null;
    const data = await this.sessionService.useLifeline(
      sessionId,
      userId,
      req.body
    );
    emitSessionChanged('lifeline_used', sessionId, userId);
    res.status(200).json(data);
  };

  /**
   * Finish a session and emit a completion event.
   * @param req Express request (expects `:session_id` and `{ status }` in `req.body`).
   * @param res Express response.
   * @returns A 200 response with finish summary.
   */
  finish = async (req: Request, res: Response) => {
    const sessionId = getParam(req.params.session_id);
    const userId = req.user?.id || null;
    const data = await this.sessionService.finish(
      sessionId,
      userId,
      req.body.status
    );
    emitSessionChanged('finished', sessionId, userId, data);
    res.status(200).json(data);
  };
}
