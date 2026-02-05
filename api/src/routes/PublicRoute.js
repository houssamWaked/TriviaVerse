/**
 * Public routes (no auth).
 *
 * Mounted at `/api/public`.
 */
import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';

export default function createPublicRouter(publicController) {
  const router = Router();

  router.get('/home-metrics', asyncHandler(publicController.homeMetrics));

  return router;
}

