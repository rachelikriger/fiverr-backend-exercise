import type { Pool } from 'pg';

export interface ClickRow {
  id: number;
  link_id: number;
  is_valid: boolean;
  created_at: Date;
}

export function createClicksRepository(pool: Pool) {
  return {
    async insert(linkId: number, isValid: boolean): Promise<ClickRow> {
      const result = await pool.query<ClickRow>(
        `INSERT INTO clicks (link_id, is_valid) VALUES ($1, $2)
         RETURNING id, link_id, is_valid, created_at`,
        [linkId, isValid]
      );
      return result.rows[0]!;
    },
  };
}
