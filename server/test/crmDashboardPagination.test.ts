import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CrmAdminService } from '../src/crmAdminService.js';

test('dashboard includes opportunities and search results after the first 500 rows', async () => {
  const rows = Array.from({ length: 501 }, (_, index) => ({
    id: `opportunity-${index}`,
    title: `Lead ${index}`,
    priority: 'normal',
    status: 'open',
    next_action: null,
    next_action_at: null,
    assigned_to: null,
    created_at: '2026-11-25T00:00:00.000Z',
    updated_at: '2026-11-25T00:00:00.000Z',
    contact: {
      id: `contact-${index}`, contact_type: 'tax-client', first_name: index === 500 ? 'Boundary' : 'Test',
      last_name: 'Lead', email: `lead${index}@example.com`, phone: null,
      lead_source: 'website', source_submission_id: null,
    },
    stage: { id: 'new', slug: 'new', name: 'New', color: null, requires_attention: false, is_closed: false },
    pipeline: { id: 'tax', slug: 'tax-client', name: 'Tax clients' },
  }));
  const requestedRanges: Array<[number, number]> = [];
  const client = {
    from(table: string) {
      const result = table === 'crm_opportunities' ? rows : [];
      const query = {
        select() { return this; },
        neq() { return this; },
        eq() { return this; },
        order() { return this; },
        range(start: number, end: number) {
          requestedRanges.push([start, end]);
          return Promise.resolve({ data: result.slice(start, end + 1), error: null });
        },
        then(resolve: (value: { data: unknown[]; error: null }) => void) {
          resolve({ data: result, error: null });
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;

  const service = new CrmAdminService(client);
  const lastPage = await service.dashboard(new URL('https://example.test/api/admin/dashboard?page=26'));
  assert.equal(lastPage.metrics.total, 501);
  assert.equal(lastPage.pagination.total, 501);
  assert.equal(lastPage.records.length, 1);
  assert.equal(lastPage.records[0].contact.firstName, 'Boundary');
  assert.deepEqual(requestedRanges.slice(0, 2), [[0, 499], [500, 999]]);

  const searched = await service.dashboard(new URL('https://example.test/api/admin/dashboard?search=Boundary'));
  assert.equal(searched.pagination.total, 1);
  assert.equal(searched.records[0].contact.firstName, 'Boundary');
});
