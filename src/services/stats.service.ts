import type { Pool } from 'pg';
import { createStatsRepository } from '../db/stats.repository.js';

export interface LinkStats {
  sellerId: string;
  targetUrl: string;
  shortCode: string;
  totalValidClicks: number;
  totalEarnings: number;
  monthlyBreakdown: Array<{
    month: string;
    validClicks: number;
    earnings: number;
  }>;
}

export function createStatsService(pool: Pool) {
  const statsRepo = createStatsRepository(pool);

  async function getStats(page: number, limit: number): Promise<LinkStats[]> {
    const rows = await statsRepo.getPaginatedLinks(page, limit);
    return rows.map((r) => ({
      sellerId: r.seller_id,
      targetUrl: r.target_url,
      shortCode: r.short_code,
      totalValidClicks: r.total_valid_clicks,
      totalEarnings: r.total_earnings,
      monthlyBreakdown: r.monthly_breakdown.map((m) => ({
        month: m.month,
        validClicks: m.validClicks,
        earnings: m.earnings,
      })),
    }));
  }

  return { getStats };
}

export type StatsService = ReturnType<typeof createStatsService>;
