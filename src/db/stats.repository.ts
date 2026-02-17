import type { Pool } from 'pg';

export interface MonthlyBreakdownItem {
  month: string;
  validClicks: number;
  earnings: number;
}

export interface LinkStatsRow {
  id: number;
  seller_id: string;
  target_url: string;
  short_code: string;
  total_valid_clicks: number;
  total_earnings: number;
  monthly_breakdown: MonthlyBreakdownItem[];
}

const CREDIT_PER_CLICK = 0.05;

export function createStatsRepository(pool: Pool) {
  return {
    async getPaginatedLinks(
      page: number,
      limit: number
    ): Promise<LinkStatsRow[]> {
      const offset = (page - 1) * limit;

      const linksResult = await pool.query<{
        id: number;
        seller_id: string;
        target_url: string;
        short_code: string;
      }>(
        `SELECT id, seller_id, target_url, short_code FROM links ORDER BY id LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const rows: LinkStatsRow[] = [];

      for (const link of linksResult.rows) {
        const monthlyResult = await pool.query<{
          month: string;
          valid_clicks: string;
        }>(
          `SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::text AS valid_clicks
           FROM clicks WHERE link_id = $1 AND is_valid = true
           GROUP BY TO_CHAR(created_at, 'YYYY-MM')
           ORDER BY month`,
          [link.id]
        );

        const monthlyBreakdown: MonthlyBreakdownItem[] = monthlyResult.rows.map(
          (r) => {
            const clicks = parseInt(r.valid_clicks, 10);
            return {
              month: r.month,
              validClicks: clicks,
              earnings: clicks * CREDIT_PER_CLICK,
            };
          }
        );

        const totalValidClicks = monthlyBreakdown.reduce(
          (sum, m) => sum + m.validClicks,
          0
        );
        const totalEarnings = totalValidClicks * CREDIT_PER_CLICK;

        rows.push({
          id: link.id,
          seller_id: link.seller_id,
          target_url: link.target_url,
          short_code: link.short_code,
          total_valid_clicks: totalValidClicks,
          total_earnings: totalEarnings,
          monthly_breakdown: monthlyBreakdown,
        });
      }

      return rows;
    },
  };
}
