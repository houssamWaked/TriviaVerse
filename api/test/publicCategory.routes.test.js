/**
 * Public category routing/validation tests.
 *
 * These tests intentionally avoid hitting Supabase:
 * - We mount the real router + middleware
 * - We stub the controller methods
 *
 * Goal:
 * - Verify route wiring and request validation
 * - Verify error formatting via `validateRequest` + `errorHandler`
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

import createPublicCategoryRouter from '../src/routes/PublicCategoryRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';

function createTestApp(controllerOverrides = {}) {
  const controller = {
    list: async (req, res) => res.json([]),
    stats: async (req, res) =>
      res.status(200).json({ category_id: req.params.id, questions_available: 0 }),
    ...controllerOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/public/categories', createPublicCategoryRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/public/categories returns 200', async () => {
  const app = createTestApp({
    list: async (req, res) => res.json([{ id: '1', name: 'Science' }]),
  });

  const res = await request(app).get('/api/public/categories');
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
});

test('GET /api/public/categories/:id/stats validates UUID', async () => {
  const app = createTestApp();

  const res = await request(app).get('/api/public/categories/not-a-uuid/stats');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});
