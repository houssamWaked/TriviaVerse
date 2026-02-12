import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

import createAuthRouter from '../src/routes/AuthRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

function createTestApp(controllerOverrides = {}) {
  const controller = {
    register: async (req, res) =>
      res.status(201).json({
        user: { id: 'u1', username: req.body.username, email: req.body.email, avatar_url: null },
        token: 'token',
      }),
    login: async (req, res) =>
      res.status(200).json({
        user: { id: 'u1', username: 'x', email: req.body.email, avatar_url: null },
        token: 'token',
      }),
    google: async (req, res) =>
      res.status(200).json({
        user: { id: 'u1', username: 'x', email: 'google@example.com', avatar_url: null },
        token: 'token',
      }),
    refresh: async (req, res) => res.status(200).json({ token: 'token' }),
    logout: async (req, res) => res.status(200).json({ success: true }),
    ...controllerOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('POST /api/auth/register validates input', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/auth/register').send({ email: 'bad', password: 'x' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('POST /api/auth/login validates input', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/auth/login').send({ email: 'bad' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('POST /api/auth/google validates input', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/auth/google').send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('POST /api/auth/refresh exists', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/auth/refresh').send({});
  assert.equal(res.status, 200);
});

test('POST /api/auth/logout exists', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/auth/logout').send({});
  assert.equal(res.status, 200);
});
