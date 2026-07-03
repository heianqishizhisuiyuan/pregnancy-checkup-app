import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getUserInitials } from './userInitials.js';

describe('getUserInitials', () => {
  it('returns first Chinese character', () => {
    assert.equal(getUserInitials('准妈妈'), '准');
  });

  it('returns uppercase first letter for English', () => {
    assert.equal(getUserInitials('alice'), 'A');
  });

  it('returns ? for empty name', () => {
    assert.equal(getUserInitials(''), '?');
  });
});
