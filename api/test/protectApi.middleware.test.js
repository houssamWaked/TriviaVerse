import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

import { createProtectApi } from '../src/middlewares/protectApi.js';

function createApp({ requireAuthImpl }) {
  const app = express();
  app.use(express.json());

  app.use('/api', createProtectApi({ requireAuth: requireAuthImpl }));

  // Dummy protected route (would normally be mounted after the gate).
  app.get('/api/protected/ping', (req, res) => res.status(200).json({ ok: true }));

  // Simple 404 so we can assert "public paths don't get 401'd".
  app.use((req, res) => res.status(404).json({ ok: false, code: 'NOT_FOUND' }));
  return app;
}

test('Non-public /api/* routes invoke requireAuth', async () => {
  let called = false;
  const app = createApp({
    requireAuthImpl: (req, res) => {
      called = true;
      return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
    },
  });

  const res = await request(app).get('/api/protected/ping');
  assert.equal(res.status, 401);
  assert.equal(called, true);
});

test('/api/public/* stays public (no requireAuth) even when route is missing', async () => {
  let called = false;
  const app = createApp({
    requireAuthImpl: () => {
      called = true;
      throw new Error('requireAuth should not be called');
    },
  });

  const res = await request(app).get('/api/public/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(called, false);
});

test('/api/auth/* stays public (no requireAuth) even when route is missing', async () => {
  let called = false;
  const app = createApp({
    requireAuthImpl: () => {
      called = true;
      throw new Error('requireAuth should not be called');
    },
  });

  const res = await request(app).get('/api/auth/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(called, false);
});
