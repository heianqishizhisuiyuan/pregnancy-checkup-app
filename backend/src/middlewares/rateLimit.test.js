import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { createRateLimiter } from './rateLimit.js';

describe('rateLimit middleware', () => {
  let originalEnv;

  before(() => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_TEST = '1';
  });

  after(() => {
    if (originalEnv.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    }
    if (originalEnv.RATE_LIMIT_TEST === undefined) {
      delete process.env.RATE_LIMIT_TEST;
    } else {
      process.env.RATE_LIMIT_TEST = originalEnv.RATE_LIMIT_TEST;
    }
  });

  it('returns 429 when request count exceeds limit', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/limited',
      createRateLimiter({ windowMs: 60_000, max: 2 }),
      (_req, res) => res.json({ ok: true })
    );

    const agent = request(app);

    await agent.post('/limited').expect(200);
    await agent.post('/limited').expect(200);
    const res = await agent.post('/limited').expect(429);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'RATE_LIMIT_EXCEEDED');
  });

  it('skips limiter in test env by default', async () => {
    delete process.env.RATE_LIMIT_TEST;

    const app = express();
    app.post(
      '/skip',
      createRateLimiter({ windowMs: 60_000, max: 1 }),
      (_req, res) => res.json({ ok: true })
    );

    const agent = request(app);
    await agent.post('/skip').expect(200);
    await agent.post('/skip').expect(200);
  });
});
