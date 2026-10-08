import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { IntakeRepository } from '../src/database.js';
import { MockGhlAdapter } from '../src/ghl.js';
import { createDominusHttpServer } from '../src/httpServer.js';
import { IntakeService } from '../src/intakeService.js';
import { AdminService } from '../src/adminService.js';

test('accepts a valid local intake over HTTP', async () => {
  const repository = new IntakeRepository(':memory:');
  const server = createDominusHttpServer(
    new IntakeService(repository, new MockGhlAdapter()),
    new AdminService(repository),
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const response = await fetch(`http://127.0.0.1:${address.port}/api/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sourceSubmissionId: 'http-test-001',
      journey: 'tax-client',
      firstName: 'Test',
      lastName: 'Client',
      email: 'client@example.com',
      phone: '4325550199',
      consent: true,
      details: { service: 'Tax preparation' },
    }),
  });
  const body = (await response.json()) as {
    duplicate: boolean;
    submission: { status: string; journey: string };
  };

  assert.equal(response.status, 201);
  assert.equal(body.duplicate, false);
  assert.equal(body.submission.status, 'synced');
  assert.equal(body.submission.journey, 'tax-client');

  server.close();
  await once(server, 'close');
  repository.close();
});

test('rejects incomplete intake payloads', async () => {
  const repository = new IntakeRepository(':memory:');
  const server = createDominusHttpServer(
    new IntakeService(repository, new MockGhlAdapter()),
    new AdminService(repository),
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const response = await fetch(`http://127.0.0.1:${address.port}/api/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ journey: 'consultant' }),
  });

  assert.equal(response.status, 400);
  server.close();
  await once(server, 'close');
  repository.close();
});
