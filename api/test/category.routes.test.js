/**
 * Category routing/validation tests.
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

import createCategoryRouter from '../src/routes/CategoryRoute.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { notFound } from '../src/middlewares/notFound.js';
import AppError from '../src/utils/AppError.js';

function createTestApp(controllerOverrides = {}) {
  const controller = {
    list: async (req, res) => res.json([]),
    search: async (req, res) => res.json([]),
    create: async (req, res) =>
      res.status(201).json({
        id: '00000000-0000-0000-0000-000000000000',
        name: req.body.name,
        icon: req.body.icon ?? null,
        created_at: null,
      }),
    update: async (req, res) =>
      res.status(200).json({
        id: req.params.id,
        name: req.body.name ?? 'Existing',
        icon: req.body.icon ?? null,
        created_at: null,
      }),
    get: async () => {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    },
    delete: async (req, res) => res.status(204).send(),
    ...controllerOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/categories', createCategoryRouter(controller));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('GET /api/categories returns 200', async () => {
  const app = createTestApp({
    list: async (req, res) => res.json([{ id: '1', name: 'Science' }]),
  });

  const res = await request(app).get('/api/categories');
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
});

test('POST /api/categories validates name', async () => {
  const app = createTestApp();

  const res = await request(app).post('/api/categories').send({ icon: 'x' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
  assert.equal(Array.isArray(res.body.errors), true);
});

test('PUT /api/categories/:id requires at least one field', async () => {
  const app = createTestApp();

  const res = await request(app)
    .put('/api/categories/00000000-0000-0000-0000-000000000000')
    .send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('GET /api/categories/:id validates UUID', async () => {
  const app = createTestApp();

  const res = await request(app).get('/api/categories/not-a-uuid');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('GET /api/categories/search validates q', async () => {
  const app = createTestApp();

  const res = await request(app).get('/api/categories/search');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});
