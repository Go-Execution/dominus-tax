import type { SupabaseClient } from '@supabase/supabase-js';
import type { IntakePayload } from './domain.js';
import type { GhlAdapter, GhlSyncResult } from './ghl.js';

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

function databaseError(operation: string, error: { message: string; code?: string }): never {
  throw new Error(`${operation} failed (${error.code || 'unknown'}): ${error.message}`);
}

/** Creates the production contact and open opportunity inside Dominus CRM. */
export class InternalCrmAdapter implements GhlAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async syncIntake(payload: IntakePayload): Promise<GhlSyncResult> {
    const pipelineSlug = payload.journey === 'consultant' ? 'consultant-recruitment' : 'tax-client';
    const firstStageSlug = payload.journey === 'consultant' ? 'application-received' : 'new-lead';

    const { data: pipeline, error: pipelineError } = await this.client
      .from('crm_pipelines')
      .select('id')
      .eq('slug', pipelineSlug)
      .eq('is_active', true)
      .single();
    if (pipelineError) databaseError('Find CRM pipeline', pipelineError);

    const { data: stage, error: stageError } = await this.client
      .from('crm_pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline.id)
      .eq('slug', firstStageSlug)
      .single();
    if (stageError) databaseError('Find CRM starting stage', stageError);

    const { data: bySubmission, error: submissionLookupError } = await this.client
      .from('crm_contacts')
      .select('id, source_submission_id')
      .eq('source_submission_id', payload.sourceSubmissionId)
      .maybeSingle();
    if (submissionLookupError) databaseError('Find CRM contact by submission', submissionLookupError);

    let contact = bySubmission;
    if (!contact) {
      const { data: byEmail, error: emailLookupError } = await this.client
        .from('crm_contacts')
        .select('id, source_submission_id')
        .eq('email_normalized', payload.email.trim().toLowerCase())
        .eq('is_archived', false)
        .maybeSingle();
      if (emailLookupError) databaseError('Find CRM contact by email', emailLookupError);
      contact = byEmail;
    }

    const contactValues = {
      contact_type: payload.journey,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      phone_e164: normalizePhone(payload.phone),
      lead_source: 'website',
      marketing_consent: payload.consent,
      consent_recorded_at: payload.consent ? payload.submittedAt || new Date().toISOString() : null,
    };

    if (contact) {
      const { error } = await this.client.from('crm_contacts').update(contactValues).eq('id', contact.id);
      if (error) databaseError('Update CRM contact', error);
    } else {
      const { data, error } = await this.client
        .from('crm_contacts')
        .insert({ ...contactValues, source_submission_id: payload.sourceSubmissionId })
        .select('id, source_submission_id')
        .single();
      if (error) databaseError('Create CRM contact', error);
      contact = data;
    }

    const { data: existingOpportunity, error: opportunityLookupError } = await this.client
      .from('crm_opportunities')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('pipeline_id', pipeline.id)
      .eq('status', 'open')
      .maybeSingle();
    if (opportunityLookupError) databaseError('Find open CRM opportunity', opportunityLookupError);

    let opportunity = existingOpportunity;
    if (!opportunity) {
      const { data, error } = await this.client
        .from('crm_opportunities')
        .insert({
          contact_id: contact.id,
          pipeline_id: pipeline.id,
          stage_id: stage.id,
          title: `${payload.firstName} ${payload.lastName} — ${payload.journey === 'consultant' ? 'Consultant' : 'Tax Client'}`,
          priority: 'normal',
          next_action: payload.journey === 'consultant' ? 'Review consultant application' : 'Contact new tax lead',
          next_action_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) databaseError('Create CRM opportunity', error);
      opportunity = data;
    }

    const { error: activityError } = await this.client.from('crm_activity_events').insert({
      contact_id: contact.id,
      opportunity_id: opportunity.id,
      event_type: 'intake.received',
      summary: `Website ${payload.journey === 'consultant' ? 'consultant' : 'tax-client'} intake received`,
      metadata: { sourceSubmissionId: payload.sourceSubmissionId },
    });
    if (activityError) databaseError('Record CRM intake activity', activityError);

    return { contactId: contact.id, opportunityId: opportunity.id };
  }
}

