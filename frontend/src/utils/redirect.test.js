import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSafeRedirect, buildLoginQuery } from './redirect.js';

describe('resolveSafeRedirect', () => {
  it('accepts internal paths', () => {
    assert.equal(resolveSafeRedirect('/record/abc'), '/record/abc');
    assert.equal(resolveSafeRedirect('/timeline?startDate=2026-01-01'), '/timeline?startDate=2026-01-01');
  });

  it('rejects external and auth paths', () => {
    assert.equal(resolveSafeRedirect('https://evil.com'), null);
    assert.equal(resolveSafeRedirect('//evil.com'), null);
    assert.equal(resolveSafeRedirect('/login'), null);
    assert.equal(resolveSafeRedirect('/register'), null);
    assert.equal(resolveSafeRedirect(''), null);
    assert.equal(resolveSafeRedirect(null), null);
  });
});

describe('buildLoginQuery', () => {
  it('includes redirect for safe paths', () => {
    assert.deepEqual(buildLoginQuery('/record/1'), { redirect: '/record/1' });
  });

  it('returns empty object for unsafe paths', () => {
    assert.deepEqual(buildLoginQuery('/login'), {});
  });
});
