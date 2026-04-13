/**
 * Duel controller.
 */
import type { Request, Response } from 'express';
import { emitDuelChanged, emitDuelStateChanged } from '../socket.js';

type DuelServiceLike = {
  listMyDuels(userId: string): Promise<any>;
  createChallenge(userId: string, body: unknown): Promise<any>;
  acceptChallenge(userId: string, duelId: string): Promise<any>;
  declineChallenge(userId: string, duelId: string): Promise<any>;
  cancelChallenge(userId: string, duelId: string): Promise<any>;
  getLiveState(userId: string, duelId: string): Promise<any>;
  submitLiveAnswer(userId: string, duelId: string, body: unknown): Promise<any>;
};

const getParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

// HTTP adapter for duels (challenge lifecycle + realtime state/answers).
export class DuelController {
  duelService: DuelServiceLike;

  /**
   * Construct a controller that delegates to duel service logic.
   * @param duelService Service implementing duel lifecycle and live state.
   * @returns A `DuelController` instance.
   */
  constructor(duelService: DuelServiceLike) {
    this.duelService = duelService;
  }

  /**
   * Load a duel entry suitable for realtime updates by re-listing the user's duels.
   * @param userId Current user id.
   * @param duelId Duel id to match.
   * @returns The matching duel entry or null.
   */
  private async getRealtimeDuelEntry(userId: string, duelId: string) {
    const entries = (await this.duelService.listMyDuels(userId)) as any[];
    return entries.find((entry) => String(entry?.id || '') === String(duelId || '')) || null;
  }

  /**
   * List duels for the current user.
   * @param req Express request (requires `req.user`).
   * @param res Express response.
   * @returns A 200 response with `{ entries }`.
   */
  listMine = async (req: Request, res: Response) => {
    const data = await this.duelService.listMyDuels(req.user!.id);
    res.status(200).json({ entries: data });
  };

  /**
   * Create a duel challenge and emit realtime updates to participants.
   * @param req Express request (requires `req.user`, challenge payload in `req.body`).
   * @param res Express response.
   * @returns A 201 response with the created duel.
   */
  create = async (req: Request, res: Response) => {
    const data = await this.duelService.createChallenge(req.user!.id, req.body);
    const duelId = String(data?.id || '');
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('created', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(201).json(data);
  };

  /**
   * Accept a duel challenge and emit realtime updates to participants.
   * @param req Express request (expects `:duel_id`).
   * @param res Express response.
   * @returns A 200 response with updated duel.
   */
  accept = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.acceptChallenge(req.user!.id, duelId);
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('accepted', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(200).json(data);
  };

  /**
   * Decline a duel challenge and emit realtime updates to participants.
   * @param req Express request (expects `:duel_id`).
   * @param res Express response.
   * @returns A 200 response with updated duel.
   */
  decline = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.declineChallenge(
      req.user!.id,
      duelId
    );
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('declined', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(200).json(data);
  };

  /**
   * Cancel a duel challenge and emit realtime updates to participants.
   * @param req Express request (expects `:duel_id`).
   * @param res Express response.
   * @returns A 200 response with updated duel.
   */
  cancel = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.cancelChallenge(req.user!.id, duelId);
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('canceled', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(200).json(data);
  };

  /**
   * Get the current live duel state (questions/answers/turn status).
   * @param req Express request (expects `:duel_id`).
   * @param res Express response.
   * @returns A 200 response with live state.
   */
  liveState = async (req: Request, res: Response) => {
    const data = await this.duelService.getLiveState(req.user!.id, getParam(req.params.duel_id));
    res.status(200).json(data);
  };

  /**
   * Submit a live duel answer and broadcast the updated state.
   * @param req Express request (expects `:duel_id` and answer payload in `req.body`).
   * @param res Express response.
   * @returns A 200 response with updated live state.
   */
  liveAnswer = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.submitLiveAnswer(
      req.user!.id,
      duelId,
      req.body
    );
    emitDuelStateChanged(duelId, data);
    res.status(200).json(data);
  };
}
