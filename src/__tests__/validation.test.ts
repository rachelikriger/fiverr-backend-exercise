import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { truncateTables } from './setup.js';

describe('Validation', () => {
  beforeEach(async () => {
    await truncateTables();
  });

  it('rejects empty sellerId', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/links')
      .send({ sellerId: '', targetUrl: 'https://example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('sellerId');
  });

  it('rejects empty targetUrl', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/links')
      .send({ sellerId: 's1', targetUrl: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('targetUrl');
  });

  it('rejects invalid URL', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/links')
      .send({ sellerId: 's1', targetUrl: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('valid');
  });

  it('returns 404 for unknown shortCode', async () => {
    const app = createApp();
    const res = await request(app).get('/l/nonexistent123');
    expect(res.status).toBe(404);
  });
});
