import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureAuthUser } from './authGuard.js';

test('loads current user before owner route check when token exists but user is missing', async () => {
  const authStore = {
    token: 'token-1',
    user: null,
    setUser(user) {
      this.user = user;
    },
    logout() {
      this.token = null;
      this.user = null;
    },
  };

  let called = 0;
  const user = await ensureAuthUser(authStore, async () => {
    called += 1;
    return {
      success: true,
      data: { id: 'u1', role: 'owner' },
    };
  });

  assert.equal(called, 1);
  assert.equal(user.role, 'owner');
  assert.equal(authStore.user.role, 'owner');
});

test('clears auth state when current user request fails', async () => {
  const authStore = {
    token: 'token-1',
    user: null,
    setUser(user) {
      this.user = user;
    },
    logout() {
      this.token = null;
      this.user = null;
    },
  };

  await assert.rejects(
    () => ensureAuthUser(authStore, async () => {
      throw new Error('unauthorized');
    }),
    /unauthorized/
  );

  assert.equal(authStore.token, null);
  assert.equal(authStore.user, null);
});
