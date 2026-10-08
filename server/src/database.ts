import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  defaultStageForJourney,
  type IntakePayload,
  type PipelineStage,
  type SubmissionRecord,
  type SubmissionStatus,
} from './domain.js';
import type {
  CreateSubmissionInput,
  CreateSubmissionResult,
  IntakeStore,
} from './store.js';

interface SubmissionRow {
  id: string;
  source_submission_id: string;
  journey: IntakePayload['journey'];
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

export class IntakeRepository implements IntakeStore {
  readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON;');
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.migrate();
  }

  private migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS intake_submissions (
        id TEXT PRIMARY KEY,
        source_submission_id TEXT NOT NULL UNIQUE,
        journey TEXT NOT NULL CHECK (journey IN ('tax-client', 'consultant')),
        email_hash TEXT NOT NULL,
        phone_last_four TEXT NOT NULL,
        consent INTEGER NOT NULL CHECK (consent IN (0, 1)),
        status TEXT NOT NULL CHECK (status IN ('received', 'synced', 'failed')),
        stage TEXT NOT NULL DEFAULT 'form-submitted',
        external_contact_id TEXT,
        external_opportunity_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS integration_events (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES intake_submissions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_intake_journey_status
        ON intake_submissions(journey, status);

      CREATE TABLE IF NOT EXISTS crm_profiles (
        user_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'consultant')),
        phone TEXT,
        avatar_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_contacts (
        id TEXT PRIMARY KEY,
        contact_type TEXT NOT NULL CHECK (contact_type IN ('tax-client', 'consultant')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        phone_e164 TEXT,
        business_name TEXT,
        lead_source TEXT NOT NULL DEFAULT 'website',
        source_submission_id TEXT UNIQUE,
        marketing_consent INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),
        consent_recorded_at TEXT,
        assigned_to TEXT,
        created_by TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (assigned_to) REFERENCES crm_profiles(user_id),
        FOREIGN KEY (created_by) REFERENCES crm_profiles(user_id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_local_crm_contacts_email
        ON crm_contacts(lower(email))
        WHERE email IS NOT NULL AND is_archived = 0;
      CREATE INDEX IF NOT EXISTS idx_local_crm_contacts_assignment
        ON crm_contacts(assigned_to, contact_type, is_archived);

      CREATE TABLE IF NOT EXISTS crm_pipelines (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        contact_type TEXT NOT NULL CHECK (contact_type IN ('tax-client', 'consultant')),
        position INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
        id TEXT PRIMARY KEY,
        pipeline_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        color TEXT,
        requires_attention INTEGER NOT NULL DEFAULT 0 CHECK (requires_attention IN (0, 1)),
        is_closed INTEGER NOT NULL DEFAULT 0 CHECK (is_closed IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (pipeline_id, slug),
        UNIQUE (pipeline_id, position),
        FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS crm_opportunities (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        pipeline_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        title TEXT NOT NULL,
        assigned_to TEXT,
        priority TEXT NOT NULL DEFAULT 'normal'
          CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status TEXT NOT NULL DEFAULT 'open'
          CHECK (status IN ('open', 'won', 'lost', 'archived')),
        next_action TEXT,
        next_action_at TEXT,
        last_activity_at TEXT,
        closed_at TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES crm_contacts(id),
        FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines(id),
        FOREIGN KEY (stage_id) REFERENCES crm_pipeline_stages(id),
        FOREIGN KEY (assigned_to) REFERENCES crm_profiles(user_id),
        FOREIGN KEY (created_by) REFERENCES crm_profiles(user_id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_local_crm_open_opportunity
        ON crm_opportunities(contact_id, pipeline_id)
        WHERE status = 'open';
      CREATE INDEX IF NOT EXISTS idx_local_crm_opportunity_board
        ON crm_opportunities(pipeline_id, stage_id, updated_at DESC);

      CREATE TABLE IF NOT EXISTS crm_tasks (
        id TEXT PRIMARY KEY,
        contact_id TEXT,
        opportunity_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal'
          CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        status TEXT NOT NULL DEFAULT 'open'
          CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
        due_at TEXT,
        completed_at TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL),
        FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES crm_profiles(user_id),
        FOREIGN KEY (created_by) REFERENCES crm_profiles(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_local_crm_task_queue
        ON crm_tasks(assigned_to, status, due_at);

      CREATE TABLE IF NOT EXISTS crm_tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        color TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_contact_tags (
        contact_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (contact_id, tag_id),
        FOREIGN KEY (contact_id) REFERENCES crm_contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES crm_tags(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS crm_activity_events (
        id TEXT PRIMARY KEY,
        contact_id TEXT,
        opportunity_id TEXT,
        task_id TEXT,
        actor_user_id TEXT,
        event_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL OR task_id IS NOT NULL),
        FOREIGN KEY (contact_id) REFERENCES crm_contacts(id),
        FOREIGN KEY (opportunity_id) REFERENCES crm_opportunities(id),
        FOREIGN KEY (task_id) REFERENCES crm_tasks(id),
        FOREIGN KEY (actor_user_id) REFERENCES crm_profiles(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_local_crm_activity_contact
        ON crm_activity_events(contact_id, created_at DESC);
    `);

    const seedTimestamp = '2026-10-09T00:00:00.000Z';
    const seedPipeline = this.database.prepare(`
      INSERT OR IGNORE INTO crm_pipelines (
        id, slug, name, contact_type, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    seedPipeline.run(
      'pipeline-tax-client',
      'tax-client',
      'Tax Client Pipeline',
      'tax-client',
      1,
      seedTimestamp,
      seedTimestamp,
    );
    seedPipeline.run(
      'pipeline-consultant-recruitment',
      'consultant-recruitment',
      'Consultant Recruitment',
      'consultant',
      2,
      seedTimestamp,
      seedTimestamp,
    );

    const seedStage = this.database.prepare(`
      INSERT OR IGNORE INTO crm_pipeline_stages (
        id, pipeline_id, slug, name, position, color, requires_attention,
        is_closed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const stageDefinitions = [
      ['tax-new-lead', 'pipeline-tax-client', 'new-lead', 'New Lead', 1, '#D4AF37', 0, 0],
      ['tax-contacted', 'pipeline-tax-client', 'contacted', 'Contacted', 2, '#C9A96E', 0, 0],
      ['tax-appointment-booked', 'pipeline-tax-client', 'appointment-booked', 'Appointment Booked', 3, '#4F8A8B', 0, 0],
      ['tax-intake-started', 'pipeline-tax-client', 'intake-started', 'Intake Started', 4, '#2F7D6D', 0, 0],
      ['tax-documents-needed', 'pipeline-tax-client', 'documents-needed', 'Documents Needed', 5, '#C06C3B', 1, 0],
      ['tax-ready-for-preparation', 'pipeline-tax-client', 'ready-for-preparation', 'Ready for Preparation', 6, '#38755B', 0, 0],
      ['tax-return-in-progress', 'pipeline-tax-client', 'return-in-progress', 'Return in Progress', 7, '#305F72', 0, 0],
      ['tax-submitted', 'pipeline-tax-client', 'submitted', 'Submitted', 8, '#655D8A', 0, 0],
      ['tax-funded', 'pipeline-tax-client', 'funded', 'Funded', 9, '#3D8361', 0, 0],
      ['tax-completed', 'pipeline-tax-client', 'completed', 'Completed', 10, '#26634F', 0, 1],
      ['tax-follow-up', 'pipeline-tax-client', 'follow-up', 'Follow-Up', 11, '#A36A2D', 1, 0],
      ['consultant-application-received', 'pipeline-consultant-recruitment', 'application-received', 'Application Received', 1, '#D4AF37', 0, 0],
      ['consultant-call-booked', 'pipeline-consultant-recruitment', 'call-booked', 'Call Booked', 2, '#4F8A8B', 0, 0],
      ['consultant-interviewed', 'pipeline-consultant-recruitment', 'interviewed', 'Interviewed', 3, '#305F72', 0, 0],
      ['consultant-accepted', 'pipeline-consultant-recruitment', 'accepted', 'Accepted', 4, '#38755B', 0, 0],
      ['consultant-onboarding', 'pipeline-consultant-recruitment', 'onboarding', 'Onboarding', 5, '#2F7D6D', 0, 0],
      ['consultant-documents-pending', 'pipeline-consultant-recruitment', 'documents-pending', 'Documents Pending', 6, '#C06C3B', 1, 0],
      ['consultant-ptin-verified', 'pipeline-consultant-recruitment', 'ptin-verified', 'PTIN Verified', 7, '#3D8361', 0, 0],
      ['consultant-training-in-progress', 'pipeline-consultant-recruitment', 'training-in-progress', 'Training in Progress', 8, '#655D8A', 0, 0],
      ['consultant-software-access-pending', 'pipeline-consultant-recruitment', 'software-access-pending', 'Software Access Pending', 9, '#A36A2D', 1, 0],
      ['consultant-active-tax-pro', 'pipeline-consultant-recruitment', 'active-tax-pro', 'Active Tax Pro', 10, '#26634F', 0, 1],
      ['consultant-rejected-inactive', 'pipeline-consultant-recruitment', 'rejected-inactive', 'Rejected / Inactive', 11, '#6B6B6B', 0, 1],
    ] as const;
    for (const stage of stageDefinitions) {
      seedStage.run(...stage, seedTimestamp, seedTimestamp);
    }

    const columns = this.database
      .prepare('PRAGMA table_info(intake_submissions)')
      .all()
      .map((column) => String((column as { name: unknown }).name));
    if (!columns.includes('stage')) {
      this.database.exec(
        "ALTER TABLE intake_submissions ADD COLUMN stage TEXT NOT NULL DEFAULT 'form-submitted';",
      );
      this.database.exec(
        "UPDATE intake_submissions SET stage = 'new-lead' WHERE journey = 'tax-client';",
      );
    }
  }

  findBySourceSubmissionId(sourceSubmissionId: string): SubmissionRecord | null {
    const row = this.database
      .prepare('SELECT * FROM intake_submissions WHERE source_submission_id = ?')
      .get(sourceSubmissionId) as unknown as SubmissionRow | undefined;
    return row ? mapSubmission(row) : null;
  }

  create(input: CreateSubmissionInput): CreateSubmissionResult {
    const result = this.database
      .prepare(`
        INSERT OR IGNORE INTO intake_submissions (
          id, source_submission_id, journey, email_hash, phone_last_four,
          consent, status, stage, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'received', ?, ?, ?)
      `)
      .run(
        input.id,
        input.payload.sourceSubmissionId,
        input.payload.journey,
        input.emailHash,
        input.phoneLastFour,
        input.payload.consent ? 1 : 0,
        defaultStageForJourney(input.payload.journey),
        input.now,
        input.now,
      );

    return {
      submission: this.findBySourceSubmissionId(input.payload.sourceSubmissionId)!,
      created: result.changes === 1,
    };
  }

  updateSyncResult(input: {
    id: string;
    status: Extract<SubmissionStatus, 'synced' | 'failed'>;
    externalContactId?: string;
    externalOpportunityId?: string;
    now: string;
  }) {
    this.database
      .prepare(`
        UPDATE intake_submissions
        SET status = ?, external_contact_id = ?, external_opportunity_id = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(
        input.status,
        input.externalContactId || null,
        input.externalOpportunityId || null,
        input.now,
        input.id,
      );
  }

  addEvent(input: {
    id: string;
    submissionId: string;
    eventType: string;
    status: string;
    message?: string;
    now: string;
  }) {
    this.database
      .prepare(`
        INSERT INTO integration_events (
          id, submission_id, event_type, status, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.id,
        input.submissionId,
        input.eventType,
        input.status,
        input.message || null,
        input.now,
      );
  }

  getById(id: string): SubmissionRecord | null {
    const row = this.database
      .prepare('SELECT * FROM intake_submissions WHERE id = ?')
      .get(id) as unknown as SubmissionRow | undefined;
    return row ? mapSubmission(row) : null;
  }

  listRecent(limit = 50): SubmissionRecord[] {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const rows = this.database
      .prepare('SELECT * FROM intake_submissions ORDER BY created_at DESC LIMIT ?')
      .all(safeLimit) as unknown as SubmissionRow[];
    return rows.map(mapSubmission);
  }

  updateStage(id: string, stage: PipelineStage, now: string): SubmissionRecord | null {
    this.database
      .prepare('UPDATE intake_submissions SET stage = ?, updated_at = ? WHERE id = ?')
      .run(stage, now, id);
    return this.getById(id);
  }

  close() {
    this.database.close();
  }
}
