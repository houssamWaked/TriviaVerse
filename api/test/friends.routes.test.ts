import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createFriendsRouter from '../src/routes/FriendsRoute.js';
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
    listFriends: async (req, res) => res.status(200).json({ friends: [] }),
    listRequests: async (req, res) => res.status(200).json({ incoming: [], outgoing: [] }),
    sendRequest: async (req, res) =>
      res.status(201).json({ status: 'requested', user: { username: req.body.username } }),
    acceptRequest: async (req, res) => res.status(200).json({ success: true }),
    declineRequest: async (req, res) => res.status(200).json({ success: true }),
    cancelRequest: async (req, res) => res.status(200).json({ success: true }),
    friendProfile: async (req, res) =>
      res.status(200).json({ user: { id: req.params.friend_user_id } }),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/friends', createFriendsRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('POST /api/friends/requests requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/friends/requests').send({ username: 'alex' });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHORIZED');
});

test('POST /api/friends/requests validates body', async () => {
  const app = createTestApp();
  const res = await request(app)
    .post('/api/friends/requests')
    .set(authHeader())
    .send({ username: '' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('GET /api/friends returns friends', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/friends').set(authHeader());
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.friends), true);
});

