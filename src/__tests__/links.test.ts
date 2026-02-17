import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { truncateTables } from './setup.js';

describe('Links API', () => {
  beforeEach(async () => {
    await truncateTables();
  });

  it('creates link and prevents duplicates (same sellerId+targetUrl)', async () => {
    const app = createApp();
    const body = {
      sellerId: 'seller-1',
      targetUrl: 'https://example.com/page',
    };

    const res1 = await request(app).post('/links').send(body);
    expect(res1.status).toBe(201);
    expect(res1.body).toHaveProperty('shortUrl');
    expect(res1.body.shortUrl).toMatch(/\/l\/[A-Za-z0-9_-]+$/);
    const shortUrl1 = res1.body.shortUrl;

    const res2 = await request(app).post('/links').send(body);
    expect(res2.status).toBe(201);
    expect(res2.body.shortUrl).toBe(shortUrl1);
  });

  it('redirects with 302 to targetUrl', async () => {
    const fraudValidator = () => Promise.resolve(true);
    const app = createApp(fraudValidator);

    const createRes = await request(app)
      .post('/links')
      .send({ sellerId: 's1', targetUrl: 'https://example.com/dest' });
    expect(createRes.status).toBe(201);

    const shortCode = createRes.body.shortUrl.split('/l/')[1];
    const redirectRes = await request(app)
      .get(`/l/${shortCode}`)
      .redirects(0);

    expect(redirectRes.status).toBe(302);
    expect(redirectRes.headers.location).toBe('https://example.com/dest');
  });

  it('when fraud=true stores valid click and stats change', async () => {
    const fraudValidator = () => Promise.resolve(true);
    const app = createApp(fraudValidator);

    const createRes = await request(app)
      .post('/links')
      .send({ sellerId: 'seller-x', targetUrl: 'https://example.com' });
    const shortCode = createRes.body.shortUrl.split('/l/')[1];

    await request(app).get(`/l/${shortCode}`).redirects(0);

    const statsRes = await request(app).get('/stats?page=1&limit=10');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body).toHaveLength(1);
    expect(statsRes.body[0]).toMatchObject({
      sellerId: 'seller-x',
      targetUrl: 'https://example.com',
      shortCode,
      totalValidClicks: 1,
      totalEarnings: 0.05,
      monthlyBreakdown: expect.arrayContaining([
        expect.objectContaining({
          month: expect.stringMatching(/^\d{4}-\d{2}$/),
          validClicks: 1,
          earnings: expect.any(Number),
        }),
      ]),
    });
  });
});
