import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createStoryRouter from '../src/routes/StoryRoute.js';
import createStoryPublicRouter from '../src/routes/StoryPublicRoute.js';
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
    listLevels: async (req, res) => res.status(200).json([]),
    progress: async (req, res) =>
      res.status(200).json({ completed_levels: 0, total_levels: 0, levels: [] }),
    start: async (req, res) =>
      res.status(201).json({ session_id: 's1', level_number: req.body.level_number }),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/story', createStoryRouter(controller));
  app.use('/api/public/story', createStoryPublicRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/story/progress requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/story/progress');
  assert.equal(res.status, 401);
});

test('POST /api/public/story/sessions/start validates body', async () => {
  const app = createTestApp();
  const res = await request(app)
    .post('/api/public/story/sessions/start')
    .set(authHeader())
    .send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});
