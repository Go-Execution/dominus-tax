import { createHash, randomUUID } from 'node:crypto';
import { intakePayloadSchema, type IntakePayload, type SubmissionRecord } from './domain.js';
import type { GhlAdapter } from './ghl.js';
import type { IntakeStore } from './store.js';

export interface IntakeResult {
  submission: SubmissionRecord;
  duplicate: boolean;
}

function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function phoneLastFour(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '*');
}

export class IntakeService {
  constructor(
    private readonly repository: IntakeStore,
    private readonly ghl: GhlAdapter,
  ) {}

  async receive(rawPayload: unknown): Promise<IntakeResult> {
    const payload: IntakePayload = intakePayloadSchema.parse(rawPayload);
    const existing = await this.repository.findBySourceSubmissionId(payload.sourceSubmissionId);
    if (existing) return { submission: existing, duplicate: true };

    const now = new Date().toISOString();
    const created = await this.repository.create({
      id: randomUUID(),
      payload,
      emailHash: hashEmail(payload.email),
      phoneLastFour: phoneLastFour(payload.phone),
      now,
    });
    if (!created.created) return { submission: created.submission, duplicate: true };
    const submission = created.submission;

    await this.repository.addEvent({
      id: randomUUID(),
      submissionId: submission.id,
      eventType: 'intake.received',
      status: 'success',
      now,
    });

    try {
      const synced = await this.ghl.syncIntake(payload);
      const syncedAt = new Date().toISOString();
      await this.repository.updateSyncResult({
        id: submission.id,
        status: 'synced',
        externalContactId: synced.contactId,
        externalOpportunityId: synced.opportunityId,
        now: syncedAt,
      });
      await this.repository.addEvent({
        id: randomUUID(),
        submissionId: submission.id,
        eventType: 'ghl.sync',
        status: 'success',
        now: syncedAt,
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      await this.repository.updateSyncResult({ id: submission.id, status: 'failed', now: failedAt });
      await this.repository.addEvent({
        id: randomUUID(),
        submissionId: submission.id,
        eventType: 'ghl.sync',
        status: 'failed',
        message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown integration error',
        now: failedAt,
      });
    }

    return { submission: (await this.repository.getById(submission.id))!, duplicate: false };
  }
}
