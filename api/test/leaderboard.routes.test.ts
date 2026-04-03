import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

import createLeaderboardRouter from '../src/routes/LeaderboardRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

function createTestApp() {
  const controller = {
    get: async (req, res) =>
      res.status(200).json({ period: req.query.period || 'all_time', mode: 'global', entries: [] }),
  };

  const app = express();
  app.use('/api/public/leaderboard', createLeaderboardRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/public/leaderboard validates period', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/public/leaderboard?period=yearly');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

