import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { HttpError } from './httpError.js';

export const opportunityUpdateSchema = z.object({
  stageId: z.uuid().optional(),
  assignedTo: z.uuid().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  nextAction: z.string().trim().max(500).nullable().optional(),
  nextActionAt: z.iso.datetime().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

export const noteSchema = z.object({
  note: z.string().trim().min(1).max(500),
});

type RecordValue = Record<string, unknown>;

function firstRelation(value: unknown): RecordValue {
  if (Array.isArray(value)) return (value[0] || {}) as RecordValue;
  return (value || {}) as RecordValue;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function databaseError(operation: string, error: { message: string; code?: string }): never {
  if (/fetch failed|failed to fetch|network/i.test(error.message)) {
    throw new HttpError(503, 'CRM database is temporarily unavailable. Please try again after the database service resumes.');
  }
  throw new Error(`${operation} failed (${error.code || 'unknown'}): ${error.message}`);
}

export class CrmAdminService {
  constructor(private readonly client: SupabaseClient) {}

  async dashboard(url: URL) {
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const journey = url.searchParams.get('journey') || 'all';
    const stageFilter = url.searchParams.get('stage') || 'all';
    const assignedFilter = url.searchParams.get('assignedTo') || 'all';
    const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
    const pageSize = Math.max(10, Math.min(50, Number(url.searchParams.get('pageSize') || 20) || 20));

    const { data: opportunityRows, error } = await this.client
      .from('crm_opportunities')
      .select(`
        id, title, priority, status, next_action, next_action_at, assigned_to,
        created_at, updated_at,
        contact:crm_contacts!inner(id, contact_type, first_name, last_name, email, phone, lead_source, source_submission_id, assigned_to),
        stage:crm_pipeline_stages!inner(id, slug, name, color, requires_attention, is_closed, position),
        pipeline:crm_pipelines!inner(id, slug, name)
      `)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) databaseError('Load CRM opportunities', error);

    const { data: profiles, error: profileError } = await this.client
      .from('crm_profiles')
      .select('user_id, full_name, role, is_active')
      .eq('is_active', true)
      .order('full_name');
    if (profileError) databaseError('Load CRM profiles', profileError);

    const { data: stageRows, error: stageError } = await this.client
      .from('crm_pipeline_stages')
      .select('id, slug, name, position, color, requires_attention, pipeline:crm_pipelines!inner(id, slug, name, contact_type)')
      .order('position');
    if (stageError) databaseError('Load CRM stages', stageError);

    const records = (opportunityRows || []).map((row) => {
      const raw = row as unknown as RecordValue;
      const contact = firstRelation(raw.contact);
      const stage = firstRelation(raw.stage);
      const pipeline = firstRelation(raw.pipeline);
      const owner = (profiles || []).find((profile) => profile.user_id === raw.assigned_to);
      return {
        id: String(raw.id),
        title: String(raw.title),
        priority: String(raw.priority),
        status: String(raw.status),
        nextAction: stringValue(raw.next_action),
        nextActionAt: stringValue(raw.next_action_at),
        assignedTo: stringValue(raw.assigned_to),
        ownerName: owner?.full_name || null,
        createdAt: String(raw.created_at),
        updatedAt: String(raw.updated_at),
        contact: {
          id: String(contact.id),
          journey: String(contact.contact_type),
          firstName: String(contact.first_name),
          lastName: String(contact.last_name),
          email: stringValue(contact.email),
          phone: stringValue(contact.phone),
          leadSource: String(contact.lead_source || 'website'),
          sourceSubmissionId: stringValue(contact.source_submission_id),
        },
        stage: {
          id: String(stage.id),
          slug: String(stage.slug),
          name: String(stage.name),
          color: stringValue(stage.color),
          requiresAttention: Boolean(stage.requires_attention),
          isClosed: Boolean(stage.is_closed),
        },
        pipeline: {
          id: String(pipeline.id),
          slug: String(pipeline.slug),
          name: String(pipeline.name),
        },
      };
    });

    const filtered = records.filter((record) => {
      const haystack = `${record.contact.firstName} ${record.contact.lastName} ${record.contact.email || ''} ${record.contact.phone || ''} ${record.contact.sourceSubmissionId || ''}`.toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (journey === 'all' || record.contact.journey === journey) &&
        (stageFilter === 'all' || record.stage.id === stageFilter) &&
        (assignedFilter === 'all' || (assignedFilter === 'unassigned' ? !record.assignedTo : record.assignedTo === assignedFilter))
      );
    });
    const start = (page - 1) * pageSize;
    const now = Date.now();
    const needsAttention = records.filter((record) =>
      record.stage.requiresAttention ||
      record.priority === 'urgent' ||
      (record.nextActionAt ? new Date(record.nextActionAt).getTime() < now : false),
    );

    return {
      generatedAt: new Date().toISOString(),
      metrics: {
        total: records.length,
        taxClients: records.filter((record) => record.contact.journey === 'tax-client').length,
        consultants: records.filter((record) => record.contact.journey === 'consultant').length,
        needsAttention: needsAttention.length,
        unassigned: records.filter((record) => !record.assignedTo).length,
        completed: records.filter((record) => record.stage.isClosed).length,
      },
      attention: needsAttention.slice(0, 20),
      records: filtered.slice(start, start + pageSize),
      pagination: { page, pageSize, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)) },
      profiles: (profiles || []).map((profile) => ({
        id: profile.user_id,
        fullName: profile.full_name,
        role: profile.role,
      })),
      stages: (stageRows || []).map((row) => {
        const pipeline = firstRelation((row as unknown as RecordValue).pipeline);
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          position: row.position,
          color: row.color,
          requiresAttention: row.requires_attention,
          pipeline: { id: String(pipeline.id), slug: String(pipeline.slug), name: String(pipeline.name), journey: String(pipeline.contact_type) },
        };
      }),
    };
  }

  async updateOpportunity(id: string, raw: unknown, actorUserId?: string) {
    const input = opportunityUpdateSchema.parse(raw);
    const { data: opportunity, error } = await this.client
      .from('crm_opportunities')
      .select('id, contact_id, pipeline_id')
      .eq('id', id)
      .maybeSingle();
    if (error) databaseError('Find CRM opportunity', error);
    if (!opportunity) throw new HttpError(404, 'Opportunity not found.');

    if (input.stageId) {
      const { data: stage, error: stageError } = await this.client
        .from('crm_pipeline_stages')
        .select('id')
        .eq('id', input.stageId)
        .eq('pipeline_id', opportunity.pipeline_id)
        .maybeSingle();
      if (stageError) databaseError('Validate CRM stage', stageError);
      if (!stage) throw new HttpError(400, 'Stage does not belong to this pipeline.');
    }
    if (input.assignedTo) {
      const { data: profile, error: profileError } = await this.client
        .from('crm_profiles')
        .select('user_id')
        .eq('user_id', input.assignedTo)
        .eq('is_active', true)
        .maybeSingle();
      if (profileError) databaseError('Validate CRM assignee', profileError);
      if (!profile) throw new HttpError(400, 'Assigned user is not active.');
    }

    const values: RecordValue = { last_activity_at: new Date().toISOString() };
    if (input.stageId !== undefined) values.stage_id = input.stageId;
    if (input.assignedTo !== undefined) values.assigned_to = input.assignedTo;
    if (input.priority !== undefined) values.priority = input.priority;
    if (input.nextAction !== undefined) values.next_action = input.nextAction;
    if (input.nextActionAt !== undefined) values.next_action_at = input.nextActionAt;

    const { data: updated, error: updateError } = await this.client
      .from('crm_opportunities')
      .update(values)
      .eq('id', id)
      .select('id, updated_at')
      .single();
    if (updateError) databaseError('Update CRM opportunity', updateError);

    const validActor = actorUserId && /^[0-9a-f-]{36}$/i.test(actorUserId) ? actorUserId : null;
    const { error: activityError } = await this.client.from('crm_activity_events').insert({
      contact_id: opportunity.contact_id,
      opportunity_id: opportunity.id,
      actor_user_id: validActor,
      event_type: 'opportunity.updated',
      summary: 'Opportunity details updated',
      metadata: input,
    });
    if (activityError) databaseError('Record opportunity update', activityError);
    return updated;
  }

  async contactDetail(contactId: string) {
    const { data: contact, error } = await this.client
      .from('crm_contacts')
      .select('id, contact_type, first_name, last_name, email, phone, lead_source, source_submission_id, assigned_to, created_at, updated_at')
      .eq('id', contactId)
      .maybeSingle();
    if (error) databaseError('Load CRM contact', error);
    if (!contact) throw new HttpError(404, 'Contact not found.');
    const [{ data: activities, error: activityError }, { data: tasks, error: taskError }] = await Promise.all([
      this.client.from('crm_activity_events').select('id, event_type, summary, metadata, created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50),
      this.client.from('crm_tasks').select('id, title, description, priority, status, due_at, completed_at, assigned_to, created_at').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50),
    ]);
    if (activityError) databaseError('Load contact activity', activityError);
    if (taskError) databaseError('Load contact tasks', taskError);
    return { contact, activities: activities || [], tasks: tasks || [] };
  }

  async addNote(contactId: string, raw: unknown, actorUserId?: string) {
    const { note } = noteSchema.parse(raw);
    const { data: contact, error } = await this.client.from('crm_contacts').select('id').eq('id', contactId).maybeSingle();
    if (error) databaseError('Find CRM contact', error);
    if (!contact) throw new HttpError(404, 'Contact not found.');
    const validActor = actorUserId && /^[0-9a-f-]{36}$/i.test(actorUserId) ? actorUserId : null;
    const { data, error: insertError } = await this.client.from('crm_activity_events').insert({
      contact_id: contactId,
      actor_user_id: validActor,
      event_type: 'note.added',
      summary: note,
    }).select('id, event_type, summary, created_at').single();
    if (insertError) databaseError('Add CRM note', insertError);
    return data;
  }
}

