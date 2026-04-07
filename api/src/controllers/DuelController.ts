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

export class DuelController {
  duelService: DuelServiceLike;

  constructor(duelService: DuelServiceLike) {
    this.duelService = duelService;
  }

  private async getRealtimeDuelEntry(userId: string, duelId: string) {
    const entries = (await this.duelService.listMyDuels(userId)) as any[];
    return entries.find((entry) => String(entry?.id || '') === String(duelId || '')) || null;
  }

  listMine = async (req: Request, res: Response) => {
    const data = await this.duelService.listMyDuels(req.user!.id);
    res.status(200).json({ entries: data });
  };

  create = async (req: Request, res: Response) => {
    const data = await this.duelService.createChallenge(req.user!.id, req.body);
    const duelId = String(data?.id || '');
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('created', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(201).json(data);
  };

  accept = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.acceptChallenge(req.user!.id, duelId);
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('accepted', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(200).json(data);
  };

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

  cancel = async (req: Request, res: Response) => {
    const duelId = getParam(req.params.duel_id);
    const data = await this.duelService.cancelChallenge(req.user!.id, duelId);
    const realtimeEntry = await this.getRealtimeDuelEntry(req.user!.id, duelId);
    emitDuelChanged('canceled', realtimeEntry || data);
    emitDuelStateChanged(duelId, await this.duelService.getLiveState(req.user!.id, duelId));
    res.status(200).json(data);
  };

  liveState = async (req: Request, res: Response) => {
    const data = await this.duelService.getLiveState(req.user!.id, getParam(req.params.duel_id));
    res.status(200).json(data);
  };

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
