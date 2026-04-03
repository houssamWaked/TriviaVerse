import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import createQuizBuilderRouter, {
  createOptionsRouter,
  createQuestionsRouter,
} from '../src/routes/QuizBuilderRoute.js';
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
    listQuizzes: async (req, res) => res.status(200).json([{ id: 'q1', title: 'My quiz' }]),
    createQuiz: async (req, res) => res.status(201).json({ id: 'q1', title: req.body.title }),
    startCustomSession: async (req, res) => res.status(201).json({ session_id: 's1' }),
    rateQuiz: async (req, res) => res.status(200).json({ ratings_avg: 5, ratings_count: 1 }),
    listQuizAccess: async (req, res) => res.status(200).json([]),
    addQuizAccess: async (req, res) => res.status(201).json({ user_id: 'u1' }),
    removeQuizAccess: async (req, res) => res.status(200).json({ success: true }),
    deleteQuiz: async (req, res) => res.status(200).json({ success: true }),
    getQuiz: async (req, res) => res.status(200).json({ id: req.params.quiz_id }),
    patchQuiz: async (req, res) => res.status(200).json({ id: req.params.quiz_id }),
    publishQuiz: async (req, res) => res.status(200).json({ id: req.params.quiz_id }),
    shareQuiz: async (req, res) => res.status(200).json({ id: req.params.quiz_id }),
    listQuizQuestions: async (req, res) => res.status(200).json([]),
    addQuizQuestion: async (req, res) => res.status(201).json({ id: 'qq1' }),
    patchQuizQuestion: async (req, res) => res.status(200).json({ id: req.params.question_id }),
    deleteQuizQuestion: async (req, res) => res.status(204).send(),
    addQuestionOption: async (req, res) => res.status(201).json({ id: 'o1' }),
    patchQuestionOption: async (req, res) => res.status(200).json({ id: req.params.option_id }),
    deleteQuestionOption: async (req, res) => res.status(204).send(),
    listPlayedQuizzes: async (_req, res) => res.status(200).json([]),
    reportQuiz: async (_req, res) => res.status(201).json({ success: true }),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/quizzes', createQuizBuilderRouter(controller as any));
  app.use('/api/questions', createQuestionsRouter(controller as any));
  app.use('/api/options', createOptionsRouter(controller as any));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

test('POST /api/quizzes requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/quizzes').send({ title: 'x' });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHORIZED');
});

test('GET /api/quizzes requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/quizzes');
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHORIZED');
});

test('GET /api/quizzes returns list', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/quizzes').set(authHeader());
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body[0].id, 'q1');
});

test('DELETE /api/quizzes/:id requires auth', async () => {
  const app = createTestApp();
  const res = await request(app).delete('/api/quizzes/00000000-0000-0000-0000-000000000000');
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'UNAUTHORIZED');
});

test('POST /api/quizzes validates body', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/quizzes').set(authHeader()).send({ title: '' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

