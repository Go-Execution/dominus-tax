import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CrmAdminService, taskCreateSchema, taskStatusSchema } from '../src/crmAdminService.js';

const contactId = 'e1333995-d5a9-4581-8ddf-042812f52e21';
const taskId = '835148e8-e396-4ff2-afbb-cd0264a70424';

test('task payloads reject unknown fields and invalid status changes', () => {
  assert.equal(taskCreateSchema.parse({ title: ' Call lead ' }).title, 'Call lead');
  assert.throws(() => taskCreateSchema.parse({ title: '', ssn: '123-45-6789' }));
  assert.throws(() => taskStatusSchema.parse({ taskId, completed: 'yes' }));
});

test('temporary admin can create an unassigned follow-up and complete it', async () => {
  let insertedTask: Record<string, unknown> | undefined;
  const updates: Array<Record<string, unknown>> = [];
  const events: Array<Record<string, unknown>> = [];
  let status = 'open';
  const client = {
    from(table: string) {
      if (table === 'crm_contacts') return {
        select() { return this; }, eq() { return this; },
        async maybeSingle() { return { data: { id: contactId, is_archived: false }, error: null }; },
      };
      if (table === 'crm_tasks') return {
        insert(values: Record<string, unknown>) {
          insertedTask = values;
          return { select() { return this; }, async single() { return { data: { id: taskId, status: 'open' }, error: null }; } };
        },
        select() { return this; }, eq() { return this; },
        async maybeSingle() { return { data: { id: taskId, status }, error: null }; },
        update(values: Record<string, unknown>) {
          updates.push(values);
          status = String(values.status);
          return { eq() { return this; }, select() { return this; }, async single() { return { data: { id: taskId, status }, error: null }; } };
        },
      };
      return { async insert(values: Record<string, unknown>) { events.push(values); return { error: null }; } };
    },
  } as unknown as SupabaseClient;
  const service = new CrmAdminService(client);
  await service.createTask(contactId, { title: ' Call lead ', priority: 'high', dueAt: null, assignedTo: null }, 'temporary-admin');
  assert.equal(insertedTask?.title, 'Call lead');
  assert.equal(insertedTask?.assigned_to, null);
  assert.equal(insertedTask?.created_by, null);
  assert.equal(events[0].event_type, 'task.created');

  await service.setTaskCompleted(contactId, { taskId, completed: true }, 'temporary-admin');
  assert.equal(updates[0].status, 'completed');
  assert.equal(typeof updates[0].completed_at, 'string');
  assert.equal(events[1].event_type, 'task.completed');
  await service.setTaskCompleted(contactId, { taskId, completed: false }, 'temporary-admin');
  assert.equal(updates[1].status, 'open');
  assert.equal(updates[1].completed_at, null);
});
