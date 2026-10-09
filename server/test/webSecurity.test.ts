import assert from 'node:assert/strict';
import { pbkdf2Sync } from 'node:crypto';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, requireCrmUser } from '../src/adminAuth.js';
import {
  createTemporaryAdminSession,
  temporaryAdminCookie,
  verifyTemporaryAdminPassword,
  verifyTemporaryAdminSession,
} from '../src/temporaryAdminAuth.js';
import { requireWebhookSecret } from '../src/webhookAuth.js';

test('webhook authentication fails closed when no secret is configured', () => {
  const previous = process.env.INTAKE_WEBHOOK_SECRET;
  delete process.env.INTAKE_WEBHOOK_SECRET;
  try {
    assert.throws(
      () => requireWebhookSecret(new Request('https://example.test/api/intake')),
      /not configured/,
    );
  } finally {
    if (previous === undefined) delete process.env.INTAKE_WEBHOOK_SECRET;
    else process.env.INTAKE_WEBHOOK_SECRET = previous;
  }
});

test('webhook authentication rejects an incorrect secret and accepts the correct one', () => {
  const previous = process.env.INTAKE_WEBHOOK_SECRET;
  process.env.INTAKE_WEBHOOK_SECRET = 'a-long-development-secret';
  try {
    assert.throws(
      () =>
        requireWebhookSecret(
          new Request('https://example.test/api/intake', {
            headers: { 'x-dominus-webhook-secret': 'incorrect-secret' },
          }),
        ),
      /Invalid webhook credentials/,
    );
    assert.doesNotThrow(() =>
      requireWebhookSecret(
        new Request('https://example.test/api/intake', {
          headers: { 'x-dominus-webhook-secret': 'a-long-development-secret' },
        }),
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.INTAKE_WEBHOOK_SECRET;
    else process.env.INTAKE_WEBHOOK_SECRET = previous;
  }
});

test('admin authorization rejects requests without a bearer token before database access', async () => {
  const fakeClient = {} as SupabaseClient;
  await assert.rejects(
    requireAdmin(new Request('https://example.test/api/admin/dashboard'), fakeClient),
    /Authentication required/,
  );
});

function fakeAuthClient(role: 'admin' | 'consultant' | null) {
  const profile = role
    ? { user_id: 'user-1', full_name: 'Test User', role, is_active: true }
    : null;
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async maybeSingle() {
      return { data: profile, error: null };
    },
  };
  return {
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-1', email: 'user@example.com' } }, error: null };
      },
    },
    from() {
      return query;
    },
  } as unknown as SupabaseClient;
}

test('CRM authorization returns the active role and blocks consultant access to admin APIs', async () => {
  const request = new Request('https://example.test/api/auth/me', {
    headers: { authorization: 'Bearer valid-test-token' },
  });
  const consultant = await requireCrmUser(request, fakeAuthClient('consultant'));
  assert.equal(consultant.profile.role, 'consultant');
  await assert.rejects(requireAdmin(request, fakeAuthClient('consultant')), /Insufficient/);
  await assert.doesNotReject(requireAdmin(request, fakeAuthClient('admin')));
});

test('temporary admin password is hashed and issues an expiring signed cookie', async () => {
  const previousEnabled = process.env.TEMP_ADMIN_AUTH_ENABLED;
  const previousHash = process.env.TEMP_ADMIN_PASSWORD_HASH;
  const previousSecret = process.env.TEMP_ADMIN_SESSION_SECRET;
  const password = 'Temporary-Test!Password-2026';
  const salt = Buffer.from('dominustest-salt');
  const digest = pbkdf2Sync(password, salt, 210_000, 32, 'sha256');

  process.env.TEMP_ADMIN_AUTH_ENABLED = 'true';
  process.env.TEMP_ADMIN_PASSWORD_HASH = `pbkdf2-sha256$210000$${salt.toString('base64url')}$${digest.toString('base64url')}`;
  process.env.TEMP_ADMIN_SESSION_SECRET = 'test-session-secret-that-is-at-least-forty-three-characters-long';

  try {
    assert.equal(verifyTemporaryAdminPassword(password), true);
    assert.equal(verifyTemporaryAdminPassword('incorrect-password'), false);
    const now = Date.now();
    const token = createTemporaryAdminSession(now);
    const cookie = temporaryAdminCookie(token);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Strict/);

    const authenticatedRequest = new Request('https://example.test/api/admin/dashboard', {
      headers: { cookie: cookie.split(';')[0] },
    });
    assert.equal(verifyTemporaryAdminSession(authenticatedRequest, now + 1_000), true);
    await assert.doesNotReject(requireAdmin(authenticatedRequest, {} as SupabaseClient));
    assert.equal(verifyTemporaryAdminSession(authenticatedRequest, now + 9 * 60 * 60 * 1000), false);
  } finally {
    if (previousEnabled === undefined) delete process.env.TEMP_ADMIN_AUTH_ENABLED;
    else process.env.TEMP_ADMIN_AUTH_ENABLED = previousEnabled;
    if (previousHash === undefined) delete process.env.TEMP_ADMIN_PASSWORD_HASH;
    else process.env.TEMP_ADMIN_PASSWORD_HASH = previousHash;
    if (previousSecret === undefined) delete process.env.TEMP_ADMIN_SESSION_SECRET;
    else process.env.TEMP_ADMIN_SESSION_SECRET = previousSecret;
  }
});
