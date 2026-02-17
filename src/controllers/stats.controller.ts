import type { Request, Response } from 'express';
import type { StatsService } from '../services/stats.service.js';

export function createStatsController(statsService: StatsService) {
  return {
    async getStats(req: Request, res: Response): Promise<void> {
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));

      const stats = await statsService.getStats(page, limit);
      res.json(stats);
    },
  };
}

export type StatsController = ReturnType<typeof createStatsController>;
