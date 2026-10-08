import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin, requireCrmUser } from '../src/adminAuth.js';
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
