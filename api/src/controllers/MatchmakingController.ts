/**
 * Matchmaking controller (async duels).
 */
import type { Request, Response } from 'express';

type BlitzMatchmakingServiceLike = {
  findOrQueue(userId: string, body: unknown): Promise<unknown>;
  getStatus(userId: string, requestId: string): Promise<unknown>;
  cancel(userId: string, requestId: string): Promise<unknown>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

// HTTP adapter for Blitz matchmaking (queue, status polling, cancellation).
export class MatchmakingController {
  blitzMatchmakingService: BlitzMatchmakingServiceLike;

  /**
   * Construct a controller that delegates to matchmaking logic.
   * @param blitzMatchmakingService Service implementing queue/matchmaking operations.
   * @returns A `MatchmakingController` instance.
   */
  constructor(blitzMatchmakingService: BlitzMatchmakingServiceLike) {
    this.blitzMatchmakingService = blitzMatchmakingService;
  }

  /**
   * Request a Blitz match (may immediately match or place the user in queue).
   * @param req Express request (matchmaking payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with request id or match result.
   */
  findBlitz = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.findOrQueue(req.user!.id, req.body);
    res.status(200).json(data);
  };

  /**
   * Poll status for a previously created matchmaking request.
   * @param req Express request (expects `:request_id`).
   * @param res Express response.
   * @returns A 200 response with current status.
   */
  blitzStatus = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.getStatus(
      req.user!.id,
      getParam(req.params.request_id)
    );
    res.status(200).json(data);
  };

  /**
   * Cancel an in-flight matchmaking request.
   * @param req Express request (expects `:request_id`).
   * @param res Express response.
   * @returns A 200 response indicating the cancellation outcome.
   */
  cancelBlitz = async (req: Request, res: Response) => {
    const data = await this.blitzMatchmakingService.cancel(
      req.user!.id,
      getParam(req.params.request_id)
    );
    res.status(200).json(data);
  };
}
