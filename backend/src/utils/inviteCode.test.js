import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInviteCode } from './inviteCode.js';

describe('generateInviteCode', () => {
  it('generates 8 character uppercase hex code', () => {
    const code = generateInviteCode();
    assert.equal(code.length, 8);
    assert.match(code, /^[0-9A-F]{8}$/);
  });
});
