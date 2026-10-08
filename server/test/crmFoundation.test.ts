import assert from 'node:assert/strict';
import test from 'node:test';
import { IntakeRepository } from '../src/database.js';

test('initializes the local custom CRM foundation with both approved pipelines', () => {
  const repository = new IntakeRepository(':memory:');
  const pipelines = repository.database
    .prepare('SELECT slug, contact_type FROM crm_pipelines ORDER BY position')
    .all() as Array<{ slug: string; contact_type: string }>;

  assert.deepEqual(pipelines.map((pipeline) => ({ ...pipeline })), [
    { slug: 'tax-client', contact_type: 'tax-client' },
    { slug: 'consultant-recruitment', contact_type: 'consultant' },
  ]);

  const stageCounts = repository.database
    .prepare(`
      SELECT p.slug, count(s.id) AS stage_count
      FROM crm_pipelines p
      JOIN crm_pipeline_stages s ON s.pipeline_id = p.id
      GROUP BY p.slug
      ORDER BY p.position
    `)
    .all() as Array<{ slug: string; stage_count: number }>;

  assert.deepEqual(stageCounts.map((pipeline) => ({ ...pipeline })), [
    { slug: 'tax-client', stage_count: 11 },
    { slug: 'consultant-recruitment', stage_count: 11 },
  ]);
  repository.close();
});

test('supports an assigned contact, opportunity, task, and audit event locally', () => {
  const repository = new IntakeRepository(':memory:');
  const now = '2026-10-09T12:00:00.000Z';

  repository.database
    .prepare(`
      INSERT INTO crm_profiles (user_id, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run('user-amanda', 'Amanda', 'admin', now, now);
  repository.database
    .prepare(`
      INSERT INTO crm_contacts (
        id, contact_type, first_name, last_name, email, assigned_to, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      'contact-1',
      'tax-client',
      'Test',
      'Client',
      'client@example.com',
      'user-amanda',
      'user-amanda',
      now,
      now,
    );
  repository.database
    .prepare(`
      INSERT INTO crm_opportunities (
        id, contact_id, pipeline_id, stage_id, title, assigned_to, next_action,
        next_action_at, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      'opportunity-1',
      'contact-1',
      'pipeline-tax-client',
      'tax-new-lead',
      'Test Client — Tax Consultation',
      'user-amanda',
      'Call the new lead',
      '2026-10-10T12:00:00.000Z',
      'user-amanda',
      now,
      now,
    );
  repository.database
    .prepare(`
      INSERT INTO crm_tasks (
        id, contact_id, opportunity_id, title, assigned_to, due_at, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      'task-1',
      'contact-1',
      'opportunity-1',
      'Call the new lead',
      'user-amanda',
      '2026-10-10T12:00:00.000Z',
      'user-amanda',
      now,
      now,
    );
  repository.database
    .prepare(`
      INSERT INTO crm_activity_events (
        id, contact_id, opportunity_id, task_id, actor_user_id, event_type,
        summary, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      'event-1',
      'contact-1',
      'opportunity-1',
      'task-1',
      'user-amanda',
      'task-created',
      'Follow-up task created',
      '{}',
      now,
    );

  const workItem = repository.database
    .prepare(`
      SELECT o.next_action, t.title AS task_title, a.event_type
      FROM crm_opportunities o
      JOIN crm_tasks t ON t.opportunity_id = o.id
      JOIN crm_activity_events a ON a.task_id = t.id
      WHERE o.id = ?
    `)
    .get('opportunity-1') as {
      next_action: string;
      task_title: string;
      event_type: string;
    };

  assert.deepEqual({ ...workItem }, {
    next_action: 'Call the new lead',
    task_title: 'Call the new lead',
    event_type: 'task-created',
  });
  repository.close();
});
