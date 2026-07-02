import test from 'node:test';
import assert from 'node:assert/strict';
import { body } from 'express-validator';
import { validateRequest } from './validateRequest.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('returns unified validation error response when express-validator has errors', async () => {
  const req = { body: { hospital: '' } };
  await body('hospital').trim().notEmpty().withMessage('医院名称不能为空').run(req);

  const res = createResponse();
  let nextCalled = false;

  validateRequest(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.match(res.body.error.message, /医院名称不能为空/);
});

test('calls next when there are no validation errors', () => {
  const req = {};
  const res = createResponse();
  let nextCalled = false;

  validateRequest(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});
