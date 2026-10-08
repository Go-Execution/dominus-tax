import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PipelineStage,
  SubmissionRecord,
  SubmissionStatus,
} from './domain.js';
import { defaultStageForJourney } from './domain.js';
import type {
  CreateSubmissionInput,
  CreateSubmissionResult,
  IntakeStore,
  IntegrationEventInput,
  SyncResultUpdate,
} from './store.js';

interface SubmissionRow {
  id: string;
  source_submission_id: string;
  journey: 'tax-client' | 'consultant';
  status: SubmissionStatus;
  stage: PipelineStage;
  phone_last_four: string;
  external_contact_id: string | null;
  external_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapSubmission(row: SubmissionRow): SubmissionRecord {
  return {
    id: row.id,
    sourceSubmissionId: row.source_submission_id,
    journey: row.journey,
    status: row.status,
    stage: row.stage,
    phoneLastFour: row.phone_last_four,
    externalContactId: row.external_contact_id,
    externalOpportunityId: row.external_opportunity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwDatabaseError(operation: string, error: { message: string; code?: string }): never {
  throw new Error(`${operation} failed (${error.code || 'unknown'}): ${error.message}`);
}

export class SupabaseIntakeStore implements IntakeStore {
  constructor(private readonly client: SupabaseClient) {}

  async findBySourceSubmissionId(sourceSubmissionId: string) {
    const { data, error } = await this.client
      .from('intake_submissions')
      .select('*')
      .eq('source_submission_id', sourceSubmissionId)
      .maybeSingle();
    if (error) throwDatabaseError('Find intake submission', error);
    return data ? mapSubmission(data as SubmissionRow) : null;
  }

  async create(input: CreateSubmissionInput): Promise<CreateSubmissionResult> {
    const { data, error } = await this.client
      .from('intake_submissions')
      .insert({
        id: input.id,
        source_submission_id: input.payload.sourceSubmissionId,
        journey: input.payload.journey,
        email_hash: input.emailHash,
        phone_last_four: input.phoneLastFour,
        consent: input.payload.consent,
        status: 'received',
        stage: defaultStageForJourney(input.payload.journey),
        created_at: input.now,
        updated_at: input.now,
      })
      .select('*')
      .single();

    if (error?.code === '23505') {
      const existing = await this.findBySourceSubmissionId(input.payload.sourceSubmissionId);
      if (!existing) throwDatabaseError('Resolve duplicate intake submission', error);
      return { submission: existing, created: false };
    }
    if (error) throwDatabaseError('Create intake submission', error);
    return { submission: mapSubmission(data as SubmissionRow), created: true };
  }

  async updateSyncResult(input: SyncResultUpdate) {
    const { error } = await this.client
      .from('intake_submissions')
      .update({
        status: input.status,
        external_contact_id: input.externalContactId || null,
        external_opportunity_id: input.externalOpportunityId || null,
        updated_at: input.now,
      })
      .eq('id', input.id);
    if (error) throwDatabaseError('Update intake sync result', error);
  }

  async addEvent(input: IntegrationEventInput) {
    const { error } = await this.client.from('integration_events').insert({
      id: input.id,
      submission_id: input.submissionId,
      event_type: input.eventType,
      status: input.status,
      message: input.message || null,
      created_at: input.now,
    });
    if (error) throwDatabaseError('Create integration event', error);
  }

  async getById(id: string) {
    const { data, error } = await this.client
      .from('intake_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throwDatabaseError('Get intake submission', error);
    return data ? mapSubmission(data as SubmissionRow) : null;
  }

  async listRecent(limit = 50) {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const { data, error } = await this.client
      .from('intake_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(safeLimit);
    if (error) throwDatabaseError('List intake submissions', error);
    return (data as SubmissionRow[]).map(mapSubmission);
  }

  async updateStage(id: string, stage: PipelineStage, now: string) {
    const { data, error } = await this.client
      .from('intake_submissions')
      .update({ stage, updated_at: now })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throwDatabaseError('Update pipeline stage', error);
    return data ? mapSubmission(data as SubmissionRow) : null;
  }
}
