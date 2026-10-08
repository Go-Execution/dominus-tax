import assert from 'node:assert/strict';
import test from 'node:test';
import { AdminService } from '../src/adminService.js';
import { IntakeRepository } from '../src/database.js';
import { MockGhlAdapter } from '../src/ghl.js';
import { IntakeService } from '../src/intakeService.js';

test('builds Amanda dashboard metrics and updates a valid consultant stage', async () => {
  const repository = new IntakeRepository(':memory:');
  const intake = new IntakeService(repository, new MockGhlAdapter());
  const admin = new AdminService(repository);

  const created = await intake.receive({
    sourceSubmissionId: 'admin-consultant-001',
    journey: 'consultant',
    firstName: 'Test',
    lastName: 'Consultant',
    email: 'admin.consultant@example.com',
    phone: '4325550111',
    consent: true,
    details: {},
  });

  const initial = await admin.dashboard();
  assert.equal(initial.metrics.total, 1);
  assert.equal(initial.metrics.consultants, 1);
  assert.equal(initial.metrics.synced, 1);
  assert.equal(initial.recent[0].stage, 'form-submitted');

  const updated = await admin.updateStage(created.submission.id, 'documents-pending');
  assert.equal(updated.stage, 'documents-pending');
  assert.equal((await admin.dashboard()).metrics.needsAttention, 1);

  repository.close();
});

test('rejects a stage from the wrong journey', async () => {
  const repository = new IntakeRepository(':memory:');
  const intake = new IntakeService(repository, new MockGhlAdapter());
  const admin = new AdminService(repository);
  const created = await intake.receive({
    sourceSubmissionId: 'admin-client-001',
    journey: 'tax-client',
    firstName: 'Test',
    lastName: 'Client',
    email: 'admin.client@example.com',
    phone: '4325550222',
    consent: true,
    details: {},
  });

  await assert.rejects(
    admin.updateStage(created.submission.id, 'training-in-progress'),
    /does not belong/,
  );
  repository.close();
});
