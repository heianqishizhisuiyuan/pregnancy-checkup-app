import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordExistsMiddleware } from './recordExists.js';

test('recordExists middleware returns 404 when record does not belong to current family', async () => {
  const middleware = createRecordExistsMiddleware({
    findRecord: async () => null
  });

  let statusCode = 200;
  let payload = null;
  let nextCalled = false;

  const req = {
    params: { recordId: 'record-123' },
    user: { familyId: 'family-1' }
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 404);
  assert.equal(payload.error.code, 'NOT_FOUND');
  assert.equal(nextCalled, false);
});

test('recordExists middleware calls next when record exists', async () => {
  const middleware = createRecordExistsMiddleware({
    findRecord: async () => ({ _id: 'record-123' })
  });

  let nextCalled = false;

  await middleware(
    {
      params: { recordId: 'record-123' },
      user: { familyId: 'family-1' }
    },
    {
      status() {
        throw new Error('status should not be called');
      },
      json() {
        throw new Error('json should not be called');
      }
    },
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
});

test('recordExists middleware returns upload failure when recordId lookup throws CastError', async () => {
  const middleware = createRecordExistsMiddleware({
    findRecord: async () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      throw error;
    }
  });

  let statusCode = 200;
  let payload = null;
  let nextCalled = false;

  const req = {
    params: { recordId: 'bad-record-id' },
    user: { familyId: 'family-1' }
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    }
  };

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 500);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, 'UPLOAD_FAILED');
  assert.equal(payload.error.message, '上传附件失败');
  assert.equal(nextCalled, false);
});
