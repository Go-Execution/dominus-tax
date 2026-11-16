# Dominus CRM backend implementation plan

## Current state — 2026-11-17

- The deployed Vercel project is `dominus-tax-consultant`, connected to `Go-Execution/dominus-tax`.
- The temporary password bridge remains the selected authentication method for now.
- The production Vercel project has the four temporary auth variables, but no Supabase variables.
- The repository's local Supabase URL points to project `kesnpnemueiboytoemwa`. The currently signed-in Supabase account has no access to it, and its endpoint is unreachable. The project owner will grant access; keep this existing project.
- The repository already has migrations for intake, privacy controls, CRM contacts, two pipelines, stages, opportunities, tasks, tags, and activity history. Their deployment state cannot be verified until the correct project is accessible.
- The existing Vercel API has read endpoints for dashboard/contact detail and write endpoints for opportunity updates and contact notes. Intake and Jotform receivers create CRM contacts and opportunities through the server adapter. These operations are coded, but live database behavior is unverified.

## Connection sequence

1. Regain access to `kesnpnemueiboytoemwa` in Supabase. Confirm its project URL, publishable key, and server secret key. Keep the secret out of Git and browser code.
2. Apply `supabase/migrations` in timestamp order. Inspect existing migration history first; do not rerun a migration that has already been applied or edit an applied migration.
3. Run `npm run check:supabase` locally with a matching `.env.production.local`. It checks endpoint availability, the CRM tables, and 11 seeded stages in each pipeline. It prints no credentials or contact records.
4. Configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as server variables on **dominus-tax-consultant**, plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser build. Preserve the four temporary password variables. Add `INTAKE_WEBHOOK_SECRET` only when the Jotform sender is ready.
5. Redeploy the correct Vercel project, then verify `/api/health` returns `healthy`, unauthorized admin requests return `401`, and a temporary-password session can load a real empty dashboard.
6. Send one synthetic submission for each approved form through the protected intake endpoint. Confirm a single contact and opportunity in the correct pipeline, then repeat each submission ID to verify idempotency. Use test identities, not taxpayer information.

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

## Prepared while project access is pending

The `codex/backend-supabase-setup` branch contains the next forward migrations. One allows the same email to exist once per journey, so a consultant who is also a tax client keeps separate records. The other adds `crm_create_manual_lead`, a server-only transaction that inserts a contact, first opportunity, and audit event together. `POST /api/admin/contacts` validates the request and calls that function. Apply the migrations before deploying this API to production; this branch is not live database functionality yet.
