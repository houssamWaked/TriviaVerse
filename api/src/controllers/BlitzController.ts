/**
 * Blitz mode controller.
 */
import type { Request, Response } from 'express';

type SessionStartServiceLike = {
  startBlitzSession(userId: string | null, body: unknown): Promise<unknown>;
};

// HTTP adapter for Blitz mode endpoints (config + session start).
export class BlitzController {
  sessionStartService: SessionStartServiceLike;

  /**
   * Construct a controller that delegates to session-start logic.
   * @param sessionStartService Service that creates Blitz sessions.
   * @returns A `BlitzController` instance.
   */
  constructor(sessionStartService: SessionStartServiceLike) {
    this.sessionStartService = sessionStartService;
  }

  /**
   * Return Blitz rules/config used by the client UI.
   * @param _req Express request (unused).
   * @param res Express response.
   * @returns A 200 response with rule parameters.
   */
  config = async (_req: Request, res: Response) => {
    res.status(200).json({
      time_limit_sec: 15,
      strikes: 1,
      rules: '15 seconds per question. Wrong or time-out ends the run. Longest streak wins.',
    });
  };

  /**
   * Start a Blitz session for the current user (or guest).
   * @param req Express request (uses `req.user?.id` and start payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with session id and initial state.
   */
  start = async (req: Request, res: Response) => {
    const data = await this.sessionStartService.startBlitzSession(req.user?.id || null, req.body);
    res.status(201).json(data);
  };
}
