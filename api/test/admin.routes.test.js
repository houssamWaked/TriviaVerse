import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createAdminRouter from '../src/routes/AdminRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS || 'admin@test.com';

function adminHeader(userId = '00000000-0000-0000-0000-000000000000') {
  const token = jwt.sign({ sub: userId, email: 'admin@test.com' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  return { Authorization: `Bearer ${token}` };
}

function createTestApp() {
  const controller = {
    listStoryLevels: async (req, res) => res.status(200).json([]),
    createStoryLevel: async (req, res) => res.status(201).json({}),
    deleteStoryLevel: async (req, res) => res.status(200).json({ success: true }),
    addStoryLevelPool: async (req, res) => res.status(200).json({}),
    seedStoryLevelPool: async (req, res) => res.status(200).json({}),
    listStoryLevelPoolQuestions: async (req, res) => res.status(200).json({ questions: [] }),
    listStoryLevelPoolQuestionIds: async (req, res) => res.status(200).json({ ids: [], count: 0 }),
    listAllAssignedQuestionIds: async (req, res) => res.status(200).json({ ids: [], count: 0 }),
    removeStoryLevelPoolQuestions: async (req, res) => res.status(200).json({}),
    replaceStoryLevelPool: async (req, res) => res.status(200).json({}),
    createGlobalQuestion: async (req, res) => res.status(201).json({}),
    listGlobalQuestions: async (req, res) => res.status(200).json({ results: [] }),
    getGlobalQuestion: async (req, res) =>
      res.status(200).json({ id: req.params.question_id, options: [] }),
    patchGlobalQuestion: async (req, res) => res.status(200).json({ id: req.params.question_id }),
    replaceGlobalQuestionOptions: async (req, res) =>
      res.status(200).json({ success: true, options: [] }),
    deleteGlobalQuestion: async (req, res) =>
      res.status(200).json({ success: true, question_id: req.params.question_id }),
    modePoolSummary: async (req, res) => res.status(200).json({ count: 0 }),
    modePoolQuestionIds: async (req, res) => res.status(200).json({ ids: [], count: 0 }),
    seedModePool: async (req, res) => res.status(200).json({}),
    listModePoolQuestions: async (req, res) => res.status(200).json({ questions: [] }),
    addModePool: async (req, res) => res.status(200).json({}),
    removeModePoolQuestions: async (req, res) => res.status(200).json({}),
    replaceModePool: async (req, res) => res.status(200).json({}),
    listClassicCategories: async (req, res) => res.status(200).json([]),
    createClassicCategory: async (req, res) => res.status(201).json({}),
    deleteClassicCategory: async (req, res) => res.status(200).json({ success: true }),
    listClassicCategoryPoolQuestions: async (req, res) => res.status(200).json({ questions: [] }),
    listClassicCategoryPoolQuestionIds: async (req, res) =>
      res.status(200).json({ ids: [], count: 0 }),
    addClassicCategoryPool: async (req, res) => res.status(200).json({}),
    removeClassicCategoryPool: async (req, res) => res.status(200).json({}),
    replaceClassicCategoryPool: async (req, res) => res.status(200).json({}),
    seedClassicCategoryPool: async (req, res) => res.status(200).json({}),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/admin', createAdminRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('DELETE /api/admin/questions/:question_id validates question_id', async () => {
  const app = createTestApp();
  const res = await request(app).delete('/api/admin/questions/not-a-uuid').set(adminHeader());
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('DELETE /api/admin/story/levels/:level_id validates level_id', async () => {
  const app = createTestApp();
  const res = await request(app).delete('/api/admin/story/levels/not-a-uuid').set(adminHeader());
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('GET /api/admin/pools/assigned returns ids', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/admin/pools/assigned').set(adminHeader());
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.ids));
  assert.equal(res.body.count, 0);
});

test('GET /api/admin/modes/:mode/pool/ids returns ids', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/admin/modes/classic/pool/ids').set(adminHeader());
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.ids));
  assert.equal(res.body.count, 0);
});

test('GET /api/admin/questions/:question_id exists', async () => {
  const app = createTestApp();
  const res = await request(app)
    .get('/api/admin/questions/00000000-0000-0000-0000-000000000000')
    .set(adminHeader());
  assert.equal(res.status, 200);
  assert.equal(res.body.id, '00000000-0000-0000-0000-000000000000');
});
