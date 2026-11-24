# Dominus CRM backend implementation plan

## Verification update — 2026-11-25

- `dominus-tax-consultant` is still connected to `Go-Execution/dominus-tax`. The live homepage, `/portal.html`, `/cms`, and `/api/health` returned HTTP 200; an unauthenticated contact edit returned HTTP 401.
- CRM manual lead entry, contact editing, and accurate dashboard pagination beyond 500 opportunities have been added to the portal and deployed. The production bundle contains those controls. Build, lint, and 28 API tests passed locally.
- `/api/health` reports the production Supabase connection as healthy. The local `.env.production.local` server key is stale, so authenticated create/update tests against the real project remain unverified. Do not infer database write success from the health check.
- The Supabase integration currently connected to Codex does not list project `kesnpnemueiboytoemwa`; reconnect it with an account that owns or can access that project before making database changes.
- Jotform webhook delivery, Calendly booking sync, task CRUD, consultant workspace, email/SMS automation, campaigns, and monitoring/restore procedures remain unverified or unimplemented. The temporary administrator password is still the selected authentication method.
- The production Vercel environment currently has no `INTAKE_WEBHOOK_SECRET`. The Jotform receiver therefore rejects submissions until a shared secret is set in Vercel and the matching webhook URL or header is configured for both Jotform forms.

The sections below preserve the original implementation sequence and earlier investigation notes.

## Current state — 2026-11-17

- The deployed Vercel project is `dominus-tax-consultant`, connected to `Go-Execution/dominus-tax`.
- The temporary password bridge remains the selected authentication method for now.
- The production Vercel project has the four temporary auth variables and the four required Supabase variables (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`). The temporary password bridge remains enabled.
- The repository's local Supabase URL points to project `kesnpnemueiboytoemwa`. On 2026-11-17, its owner account opened the project in Opera and the dashboard reported Healthy. Its API endpoint and publishable key respond. The server secret key currently saved in `.env.production.local` is invalid for this project; replace it with the current key without exposing it in Git, chat, or logs.
- The repository already has migrations for intake, privacy controls, CRM contacts, two pipelines, stages, opportunities, tasks, tags, and activity history. The project table editor shows these CRM tables and both pipelines have 11 stages. The dashboard reports no tracked migrations, so the existing schema appears to have been applied outside the migration tracker. The two November 17 forward migrations were applied in the SQL Editor: journey-scoped contact email uniqueness and the server-only `crm_create_manual_lead` function. The function grants `service_role` execute access and denies `anon`.
- The existing Vercel API has read endpoints for dashboard/contact detail and write endpoints for opportunity updates and contact notes. Intake and Jotform receivers create CRM contacts and opportunities through the server adapter. These operations are coded, but live database behavior is unverified.

## Connection sequence

1. Use the existing healthy project `kesnpnemueiboytoemwa`. Keep its current server secret out of Git and browser code. The schema and November 17 forward changes have been audited and applied; do not rerun the older foundational migrations.
2. Replace the stale server key in the ignored local `.env.production.local`, then run `npm run check:supabase`. It checks endpoint availability, the CRM tables, and 11 seeded stages in each pipeline. It prints no credentials or contact records.
3. Redeploy **dominus-tax-consultant** using the four Production Supabase variables already configured. Preserve the four temporary password variables. Add `INTAKE_WEBHOOK_SECRET` only when the Jotform sender is ready.
4. Verify `/api/health` returns `healthy`, unauthorized admin requests return `401`, and a temporary-password session can load a real empty dashboard.
5. Send one synthetic submission for each approved form through the protected intake endpoint. Confirm a single contact and opportunity in the correct pipeline, then repeat each submission ID to verify idempotency. Use test identities, not taxpayer information.

## Backend functionality order

| Order | Capability | Completion check |
| --- | --- | --- |
| 1 | Database connection and migrations | Health is green; correct pipelines and RLS policies exist. |
| 2 | Contact CRUD and duplicate handling | Admin can add/edit a lead; repeated email or submission does not create duplicates. |
| 3 | Opportunity workflow | Stage, owner, priority, and next action persist with an activity event. |
| 4 | Tasks and attention queue | Assignments, due dates, completion, and overdue counts reflect database state. |
| 5 | Search and pagination | Database filters and counts work beyond 500 opportunities; no page silently omits records. |
| 6 | Booking and onboarding | Appointment and checklist status move the correct opportunity through approved stages. |
| 7 | Communications | Verified email/SMS providers, consent and opt-out rules, retries, delivery events, and templates. |
| 8 | Reporting and operations | Audit trail, error monitoring, backups, and export are verified. |

The browser must never receive the Supabase secret key. CRM writes go through authenticated server endpoints. Tax returns, SSNs, bank details, and unrestricted taxpayer documents remain outside this CRM schema.

## Manual lead API rollout

The codebase includes the November 17 migrations and `POST /api/admin/contacts`. The database changes have been applied to the existing project. Deploy this code to activate the API, then verify a synthetic manual lead creates one contact, one opportunity in the correct starting stage, and one activity event.
