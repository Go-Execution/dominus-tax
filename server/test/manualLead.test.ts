import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CrmAdminService, manualLeadSchema } from '../src/crmAdminService.js';

const lead = {
  journey: 'consultant',
  firstName: '  Ada  ',
  lastName: '  Lovelace ',
  email: ' ADA@example.com ',
};

test('manual lead input accepts a valid journey and normalizes identity fields', () => {
  const parsed = manualLeadSchema.parse(lead);
  assert.equal(parsed.firstName, 'Ada');
  assert.equal(parsed.lastName, 'Lovelace');
  assert.equal(parsed.email, 'ada@example.com');
  assert.throws(() => manualLeadSchema.parse({ ...lead, journey: 'other' }));
  assert.throws(() => manualLeadSchema.parse({ ...lead, email: 'invalid' }));
  assert.throws(() => manualLeadSchema.parse({ ...lead, ssn: '123-45-6789' }));
});

test('manual lead calls the atomic database function and does not use the temporary actor as a UUID', async () => {
  let call: { name: string; values: Record<string, unknown> } | undefined;
  const client = {
    async rpc(name: string, values: Record<string, unknown>) {
      call = { name, values };
      return { data: [{ contact_id: 'contact-id', opportunity_id: 'opportunity-id' }], error: null };
    },
  } as unknown as SupabaseClient;
  const result = await new CrmAdminService(client).createManualLead(lead, 'temporary-admin');
  assert.deepEqual(result, { contactId: 'contact-id', opportunityId: 'opportunity-id' });
  assert.equal(call?.name, 'crm_create_manual_lead');
  assert.equal(call?.values.p_email, 'ada@example.com');
  assert.equal(call?.values.p_contact_type, 'consultant');
  assert.equal(call?.values.p_actor_user_id, null);
});

test('manual lead reports a same-journey duplicate as a conflict', async () => {
  const client = {
    async rpc() {
      return { data: null, error: { code: '23505', message: 'duplicate key' } };
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    new CrmAdminService(client).createManualLead(lead),
    (error: unknown) => error instanceof Error && 'status' in error && error.status === 409,
  );
});
