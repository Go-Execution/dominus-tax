import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { contactUpdateSchema, CrmAdminService } from '../src/crmAdminService.js';

test('contact edits normalize fields and reject unrelated or empty payloads', () => {
  assert.deepEqual(contactUpdateSchema.parse({ firstName: ' Ada ', email: ' ADA@EXAMPLE.COM ' }), {
    firstName: 'Ada', email: 'ada@example.com',
  });
  assert.throws(() => contactUpdateSchema.parse({}));
  assert.throws(() => contactUpdateSchema.parse({ ssn: '123-45-6789' }));
  assert.throws(() => contactUpdateSchema.parse({ email: 'invalid' }));
});

test('contact edit persists safe fields and records an audit event', async () => {
  let updateValues: Record<string, unknown> | undefined;
  let activity: Record<string, unknown> | undefined;
  const client = {
    from(table: string) {
      if (table === 'crm_contacts') return {
        update(values: Record<string, unknown>) {
          updateValues = values;
          return { eq() { return this; }, select() { return this; }, async maybeSingle() {
            return { data: { id: 'contact-1', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phone: null }, error: null };
          } };
        },
      };
      return { async insert(values: Record<string, unknown>) { activity = values; return { error: null }; } };
    },
  } as unknown as SupabaseClient;
  const result = await new CrmAdminService(client).updateContact('contact-1', {
    firstName: ' Ada ', email: ' ADA@example.com ', phone: null,
  }, 'temporary-admin');
  assert.equal(result.id, 'contact-1');
  assert.deepEqual(updateValues, { first_name: 'Ada', email: 'ada@example.com', phone: null });
  assert.equal(activity?.event_type, 'contact.updated');
  assert.equal(activity?.actor_user_id, null);
  assert.deepEqual(activity?.metadata, { fields: ['first_name', 'email', 'phone'] });
});
