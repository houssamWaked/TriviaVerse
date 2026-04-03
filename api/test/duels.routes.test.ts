import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createDuelsRouter from '../src/routes/DuelsRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

function authHeader(userId = '00000000-0000-0000-0000-000000000000') {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

function createTestApp() {
  const controller = {
    listMine: async (req, res) => res.status(200).json({ entries: [] }),
    create: async (req, res) => res.status(201).json({ id: 'ok' }),
    accept: async (req, res) => res.status(200).json({ ok: true }),
    decline: async (req, res) => res.status(200).json({ ok: true }),
    cancel: async (req, res) => res.status(200).json({ ok: true }),
    liveState: async (req, res) => res.status(200).json({ id: req.params.duel_id }),
    liveAnswer: async (req, res) => res.status(200).json({ ok: true }),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/duels', createDuelsRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/duels requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/duels');
  assert.equal(res.status, 401);
});

test('POST /api/duels validates body', async () => {
  const app = createTestApp();
  const res = await request(app)
    .post('/api/duels')
    .set(authHeader())
    .send({ friend_user_id: 'nope', quiz_id: 'nope' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('GET /api/duels/:duel_id/state validates duel_id', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/duels/not-a-uuid/state').set(authHeader());
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

