# Dominus 360 Custom CRM — Approved Build Direction

## Product decision

Dominus 360 will be a custom CRM inspired by the GoHighLevel operating model. GoHighLevel is a
functional reference, not a runtime dependency and not the system of record.

The existing public website remains the entry point. Vercel Functions provide the authenticated API
layer and Supabase provides PostgreSQL, Auth, and private storage. Development remains local until a
separate deployment approval.

## Module sequence

1. **CRM data foundation** — roles, contacts, two pipelines, stages, assignments, tasks, tags,
   next actions, and activity history.
2. **Authentication and authorization** — Amanda administrator access, consultant accounts, and
   assigned-record boundaries.
3. **Contacts workspace** — searchable contacts, duplicate detection, filters, and contact detail.
4. **Pipeline boards** — drag-and-drop Tax Client and Consultant Recruitment Kanban boards.
5. **Amanda attention queue** — reason, age, owner, priority, due date, and next action.
6. **Consultant onboarding** — agreements, W-9, PTIN, training, software access, and activation gates.
7. **Website intake** — map both public form journeys into contacts and opportunities idempotently.
8. **Communication and scheduling** — templates, email/SMS providers, calendars, reminders,
   no-show recovery, and consent/opt-out handling.
9. **Finance and reporting** — funded returns, 70/30 split, payouts, referrals, and Legacy Bonus.

## Module 1 schema

The first module is implemented by
`supabase/migrations/20261009000300_create_custom_crm_foundation.sql`.

It introduces:

- `crm_profiles`: administrator and consultant identities.
- `crm_contacts`: tax clients and consultant contacts.
- `crm_pipelines` and `crm_pipeline_stages`: configurable workflow boards.
- `crm_opportunities`: stage, owner, priority, next action, and closure state.
- `crm_tasks`: due work and overdue queues.
- `crm_tags` and `crm_contact_tags`: smart-list building blocks.
- `crm_activity_events`: operational audit history.
- Links from the existing idempotent intake receiver to CRM contacts and opportunities.

The migration seeds the approved Tax Client and Consultant Recruitment pipelines. Authenticated
browser sessions are read-only, consultants can see assigned work only, and writes must pass through
trusted authenticated APIs.

## Security boundary

CRM tables may contain ordinary contact and workflow data. They must not contain:

- Social Security numbers
- complete tax returns
- banking credentials
- account passwords
- unrestricted taxpayer document uploads

Sensitive-document handling requires its own reviewed storage, encryption, retention, access,
download logging, and multifactor-authentication design before implementation.

## Module 1 acceptance criteria

- Two pipelines are seeded with ordered stages.
- A contact can have an assigned owner.
- An open opportunity carries a stage, priority, and next action.
- Tasks can be assigned and queried by status/due date.
- Activity events can be attached to contacts, opportunities, or tasks.
- Consultants cannot read another consultant's assigned contacts/opportunities/tasks.
- Browser sessions cannot directly mutate CRM tables.
- Existing intake, website, and build tests remain green.
