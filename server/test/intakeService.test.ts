import assert from 'node:assert/strict';
import test from 'node:test';
import { IntakeRepository } from '../src/database.js';
import type { GhlAdapter } from '../src/ghl.js';
import { IntakeService } from '../src/intakeService.js';

const validPayload = {
  sourceSubmissionId: 'jotform-test-001',
  journey: 'consultant' as const,
  firstName: 'Test',
  lastName: 'Consultant',
  email: 'test.consultant@example.com',
  phone: '(432) 555-0123',
  consent: true,
  submittedAt: '2026-10-08T12:00:00.000Z',
  details: { experience: '2 years' },
};

test('stores privacy-safe metadata and records a successful mock sync', async () => {
  const repository = new IntakeRepository(':memory:');
  const adapter: GhlAdapter = {
    async syncIntake() {
      return { contactId: 'contact_1', opportunityId: 'opportunity_1' };
    },
  };
  const service = new IntakeService(repository, adapter);

  const result = await service.receive(validPayload);

  assert.equal(result.duplicate, false);
  assert.equal(result.submission.status, 'synced');
  assert.equal(result.submission.externalContactId, 'contact_1');
  assert.equal(result.submission.externalOpportunityId, 'opportunity_1');

  const columns = repository.database
    .prepare('PRAGMA table_info(intake_submissions)')
    .all()
    .map((column) => String((column as { name: unknown }).name));
  assert.equal(columns.includes('email'), false);
  assert.equal(columns.includes('phone'), false);
  assert.equal(columns.includes('details'), false);
  repository.close();
});

test('treats a repeated source submission as idempotent', async () => {
  const repository = new IntakeRepository(':memory:');
  let syncCalls = 0;
  const adapter: GhlAdapter = {
    async syncIntake() {
      syncCalls += 1;
      return { contactId: 'contact_1', opportunityId: 'opportunity_1' };
    },
  };
  const service = new IntakeService(repository, adapter);

  const first = await service.receive(validPayload);
  const second = await service.receive(validPayload);

  assert.equal(second.duplicate, true);
  assert.equal(second.submission.id, first.submission.id);
  assert.equal(syncCalls, 1);
  repository.close();
});

test('records a failed integration without exposing the lead payload', async () => {
  const repository = new IntakeRepository(':memory:');
  const adapter: GhlAdapter = {
    async syncIntake() {
      throw new Error('Local simulated failure');
    },
  };
  const service = new IntakeService(repository, adapter);

  const result = await service.receive({ ...validPayload, sourceSubmissionId: 'failure-001' });

  assert.equal(result.submission.status, 'failed');
  assert.equal(result.submission.externalContactId, null);
  repository.close();
});
