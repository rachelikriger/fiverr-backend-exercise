import type { Pool } from 'pg';

export interface LinkRow {
  id: number;
  seller_id: string;
  target_url: string;
  short_code: string;
  created_at: Date;
}

export interface CreateLinkParams {
  sellerId: string;
  targetUrl: string;
  shortCode: string;
}

export function createLinksRepository(pool: Pool) {
  return {
    async findBySellerAndTarget(
      sellerId: string,
      targetUrl: string
    ): Promise<LinkRow | null> {
      const result = await pool.query<LinkRow>(
        `SELECT id, seller_id, target_url, short_code, created_at
         FROM links WHERE seller_id = $1 AND target_url = $2`,
        [sellerId, targetUrl]
      );
      return result.rows[0] ?? null;
    },

    async findByShortCode(shortCode: string): Promise<LinkRow | null> {
      const result = await pool.query<LinkRow>(
        `SELECT id, seller_id, target_url, short_code, created_at
         FROM links WHERE short_code = $1`,
        [shortCode]
      );
      return result.rows[0] ?? null;
    },

    async create(params: CreateLinkParams): Promise<LinkRow> {
      const result = await pool.query<LinkRow>(
        `INSERT INTO links (seller_id, target_url, short_code)
         VALUES ($1, $2, $3)
         RETURNING id, seller_id, target_url, short_code, created_at`,
        [params.sellerId, params.targetUrl, params.shortCode]
      );
      return result.rows[0]!;
    },
  };
}
