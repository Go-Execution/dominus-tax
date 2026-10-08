import { createHash } from 'node:crypto';
import type { IntakePayload } from './domain.js';

export interface GhlSyncResult {
  contactId: string;
  opportunityId: string;
}

export interface GhlAdapter {
  syncIntake(payload: IntakePayload): Promise<GhlSyncResult>;
}

function stableMockId(prefix: string, sourceSubmissionId: string) {
  const suffix = createHash('sha256').update(sourceSubmissionId).digest('hex').slice(0, 16);
  return `${prefix}_${suffix}`;
}

/**
 * Local-only adapter. It validates the complete flow without transmitting lead data.
 * A reviewed server-side GHL adapter will replace this when credentials are available.
 */
export class MockGhlAdapter implements GhlAdapter {
  async syncIntake(payload: IntakePayload): Promise<GhlSyncResult> {
    return {
      contactId: stableMockId('mock_contact', payload.sourceSubmissionId),
      opportunityId: stableMockId('mock_opportunity', payload.sourceSubmissionId),
    };
  }
}

export class DisabledGhlAdapter implements GhlAdapter {
  async syncIntake(): Promise<GhlSyncResult> {
    throw new Error('GHL integration is not configured.');
  }
}
