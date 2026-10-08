import type {
  IntakePayload,
  PipelineStage,
  SubmissionRecord,
  SubmissionStatus,
} from './domain.js';

export interface CreateSubmissionInput {
  id: string;
  payload: IntakePayload;
  emailHash: string;
  phoneLastFour: string;
  now: string;
}

export interface CreateSubmissionResult {
  submission: SubmissionRecord;
  created: boolean;
}

export interface SyncResultUpdate {
  id: string;
  status: Extract<SubmissionStatus, 'synced' | 'failed'>;
  externalContactId?: string;
  externalOpportunityId?: string;
  now: string;
}

export interface IntegrationEventInput {
  id: string;
  submissionId: string;
  eventType: string;
  status: string;
  message?: string;
  now: string;
}

export interface IntakeStore {
  findBySourceSubmissionId(
    sourceSubmissionId: string,
  ): SubmissionRecord | null | Promise<SubmissionRecord | null>;
  create(input: CreateSubmissionInput): CreateSubmissionResult | Promise<CreateSubmissionResult>;
  updateSyncResult(input: SyncResultUpdate): void | Promise<void>;
  addEvent(input: IntegrationEventInput): void | Promise<void>;
  getById(id: string): SubmissionRecord | null | Promise<SubmissionRecord | null>;
  listRecent(limit?: number): SubmissionRecord[] | Promise<SubmissionRecord[]>;
  updateStage(
    id: string,
    stage: PipelineStage,
    now: string,
  ): SubmissionRecord | null | Promise<SubmissionRecord | null>;
}
