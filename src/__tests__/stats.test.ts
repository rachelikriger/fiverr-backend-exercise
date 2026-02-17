import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { pool } from '../config/db.js';
import { truncateTables } from './setup.js';

describe('Stats API', () => {
  beforeEach(async () => {
    await truncateTables();
  });

  it('returns correct pagination and monthly aggregation from seeded clicks', async () => {
    const app = createApp(() => Promise.resolve(true));

    const createRes = await request(app)
      .post('/links')
      .send({ sellerId: 'seller-pag', targetUrl: 'https://example.com/a' });
    const shortCode = createRes.body.shortUrl.split('/l/')[1];

    const linkResult = await pool.query<{ id: number }>(
      'SELECT id FROM links WHERE short_code = $1',
      [shortCode]
    );
    const row = linkResult.rows[0];
    if (!row) {
      throw new Error(`Link not found for shortCode: ${shortCode}`);
    }
    const linkId = row.id;

    await pool.query(
      `INSERT INTO clicks (link_id, is_valid, created_at) VALUES
       ($1, true, '2024-01-15 10:00:00+00'),
       ($1, true, '2024-01-20 10:00:00+00'),
       ($1, true, '2024-02-01 10:00:00+00'),
       ($1, false, '2024-02-02 10:00:00+00')`,
      [linkId]
    );

    const statsRes = await request(app).get('/stats?page=1&limit=10');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body).toHaveLength(1);

    const link = statsRes.body[0];
    expect(link.sellerId).toBe('seller-pag');
    expect(link.targetUrl).toBe('https://example.com/a');
    expect(link.shortCode).toBe(shortCode);
    expect(link.totalValidClicks).toBe(3);
    expect(link.totalEarnings).toBeCloseTo(0.15);

    const months = link.monthlyBreakdown.map((m: { month: string }) => m.month);
    expect(months).toContain('2024-01');
    expect(months).toContain('2024-02');

    const jan = link.monthlyBreakdown.find(
      (m: { month: string }) => m.month === '2024-01'
    );
    expect(jan).toMatchObject({
      month: '2024-01',
      validClicks: 2,
    });
    expect(jan!.earnings).toBeCloseTo(0.1);

    const feb = link.monthlyBreakdown.find(
      (m: { month: string }) => m.month === '2024-02'
    );
    expect(feb).toMatchObject({
      month: '2024-02',
      validClicks: 1,
    });
    expect(feb!.earnings).toBeCloseTo(0.05);
  });

  it('respects page and limit', async () => {
    const app = createApp();
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/links')
        .send({
          sellerId: `seller-${i}`,
          targetUrl: `https://example.com/${i}`,
        });
    }

    const page1 = await request(app).get('/stats?page=1&limit=2');
    expect(page1.body).toHaveLength(2);

    const page2 = await request(app).get('/stats?page=2&limit=2');
    expect(page2.body).toHaveLength(2);

    const page3 = await request(app).get('/stats?page=3&limit=2');
    expect(page3.body).toHaveLength(1);
  });
});
