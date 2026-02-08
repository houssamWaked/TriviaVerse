import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createSessionsRouter from '../src/routes/SessionsRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function authHeader(userId = '00000000-0000-0000-0000-000000000000') {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

function createTestApp() {
  const controller = {
    current: async (req, res) => res.status(200).json({ session_id: req.params.session_id }),
    answer: async (req, res) => res.status(200).json({ ok: true }),
    useLifeline: async (req, res) => res.status(200).json({ ok: true }),
    finish: async (req, res) => res.status(200).json({ status: 'completed' }),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/sessions', createSessionsRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/sessions/:id/current allows guest access (router level)', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/sessions/00000000-0000-0000-0000-000000000000/current');
  assert.equal(res.status, 200);
});

test('GET /api/sessions/:id/current validates session_id', async () => {
  const app = createTestApp();
  const res = await request(app)
    .get('/api/sessions/not-a-uuid/current')
    .set(authHeader());
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});
