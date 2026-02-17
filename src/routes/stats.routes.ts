import { Router } from 'express';
import type { StatsController } from '../controllers/stats.controller.js';

export function createStatsRoutes(statsController: StatsController) {
  const router = Router();
  router.get('/stats', (req, res, next) =>
    statsController.getStats(req, res).catch(next)
  );
  return router;
}
