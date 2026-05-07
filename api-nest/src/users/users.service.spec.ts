import test from 'node:test';
import assert from 'node:assert/strict';
import { UsersService } from './users.service';

test('UsersService builds profile mode summaries from sessions', () => {
  const service = new UsersService({} as any, {} as any);
  const entries = (service as any).buildModeEntries([
    {
      mode: 'classic',
      status: 'completed',
      score_total: 7,
      started_at: '2026-01-01T00:00:00.000Z',
    },
    {
      mode: 'classic',
      status: 'completed',
      score_total: 11,
      started_at: '2026-01-02T00:00:00.000Z',
    },
    {
      mode: 'blitz',
      status: 'in_progress',
      score_total: 3,
      started_at: '2026-01-03T00:00:00.000Z',
    },
  ]);

  const classic = entries.find((entry: any) => entry.mode === 'classic');
  const blitz = entries.find((entry: any) => entry.mode === 'blitz');

  assert.equal(classic.played, 2);
  assert.equal(classic.completed, 2);
  assert.equal(classic.best_score, 11);
  assert.equal(blitz.played, 1);
  assert.equal(blitz.completed, 0);
});
