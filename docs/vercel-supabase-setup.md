# Dominus — Vercel + Supabase Production Setup

The repository is production-structured but is **not deployed**. Complete this checklist when the approved Vercel and Supabase projects are available.

## Architecture

```text
Browser (Vite on Vercel)
  ├─ public Dominus website
  └─ Amanda dashboard
       └─ Supabase Auth session JWT
              ↓ Authorization: Bearer <token>
Vercel Functions (/api)
  ├─ verify the Supabase JWT against crm_profiles
  ├─ enforce admin/consultant role permissions
  ├─ validate intake payloads
  └─ use server-only Supabase secret key
              ↓
Supabase Postgres
  ├─ intake_submissions
  ├─ integration_events
  ├─ crm_profiles
  ├─ crm_contacts / crm_opportunities / crm_tasks
  └─ CRM activity and pipeline tables
```

SQLite remains available only for local development. Vercel Functions use Supabase automatically.

## 1. Create or connect Supabase

Create the project in Supabase directly or through the Vercel Marketplace integration. Record:

- Project URL
- Publishable key
- Server secret key (or legacy service-role key)

The publishable key may be exposed to the Vite browser bundle. The secret/service-role key must remain server-only because it bypasses Row Level Security.

## 2. Apply database migrations

Apply every SQL file in `supabase/migrations` in timestamp order using the Supabase CLI or Dashboard SQL editor.

The production migrations:

- create privacy-minimized CRM metadata tables,
- enable RLS,
- revoke browser roles from CRM tables,
- create the administrator allowlist,
- and remove the legacy anonymous appointment policies.

Do not restore anonymous `SELECT` access to CRM or appointment tables.

## 3. Create Amanda's administrator account

1. In Supabase Dashboard → Authentication → Users, invite/create Amanda's approved email.
2. Copy the created user's UUID.
3. Run:

```sql
insert into public.crm_profiles (user_id, full_name, role, is_active)
values ('AMANDA_AUTH_USER_UUID', 'Amanda', 'admin', true)
on conflict (user_id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;
```

Only active `admin` profiles can access `/api/admin/*`. Active consultants can authenticate but
cannot access Amanda's APIs or records assigned to another consultant.

## 4. Configure Auth URLs

In Supabase Authentication URL settings:

- Set the production Site URL to the final HTTPS domain.
- Add `http://127.0.0.1:5173/**` for local development.
- Add the approved Vercel preview pattern if preview logins are required.

The dashboard uses PKCE magic-link authentication and redirects to `/#admin`.

## 5. Add Vercel environment variables

Configure the variables separately for Production and Preview. Do not copy production secrets into untrusted preview branches.

| Variable | Scope | Secret? | Purpose |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Build/browser | No | Browser Auth project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build/browser | No | Browser-safe Supabase key |
| `SUPABASE_URL` | Functions | No | Server Supabase URL |
| `SUPABASE_SECRET_KEY` | Functions | **Yes** | Server database access |
| `INTAKE_WEBHOOK_SECRET` | Functions | **Yes** | Authenticates Jotform/automation intake calls |
| `GHL_INTEGRATION_MODE` | Functions | No | Keep `disabled` until live adapter approval |
| `VITE_CLIENT_INTAKE_FORM_URL` | Build/browser | No | Client Jotform embed |
| `VITE_CONSULTANT_ONBOARDING_FORM_URL` | Build/browser | No | Consultant Jotform embed |

### Temporary password bridge

Until the approved Supabase email account is provisioned, the dashboard can use a short-lived
shared-password bridge. Set `VITE_TEMP_ADMIN_AUTH_ENABLED=true`,
`TEMP_ADMIN_AUTH_ENABLED=true`, and store `TEMP_ADMIN_PASSWORD_HASH` plus
`TEMP_ADMIN_SESSION_SECRET` as Vercel secrets. The password itself must never be committed or
stored as an environment variable. Sessions are signed, `HttpOnly`, `Secure`, `SameSite=Strict`,
and expire after eight hours.

Disable and remove all four temporary variables when email authentication is activated.

Never create a `VITE_SUPABASE_SECRET_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, or `VITE_INTAKE_WEBHOOK_SECRET` variable.

## 6. Configure the intake sender

The production endpoint is:

```http
POST https://YOUR_DOMAIN/api/intake
Content-Type: application/json
X-Dominus-Webhook-Secret: THE_SAME_SECRET_AS_VERCEL
```

Jotform's native integration, Make, Zapier, or another trusted server-side automation must transform submissions into the documented intake contract. The secret header must be set by that trusted automation—not by browser JavaScript.

Until the live GHL adapter is reviewed, `GHL_INTEGRATION_MODE` should remain `disabled`. Intakes will be recorded safely and surfaced as needing attention rather than falsely marked synced.

## 7. Pre-deployment verification

Run:

```powershell
npm ci
npm run test:api
npm run typecheck
npm run typecheck:api
npm run typecheck:vercel
npm run lint
npm run build:vercel
```

Then verify in a Vercel Preview deployment:

- Website and both Jotforms load.
- Unauthenticated `/api/admin/dashboard` returns `401`.
- A signed-in user not listed in `admin_users` receives `403`.
- Amanda can sign in by magic link.
- An invalid intake webhook secret receives `401`.
- A valid test intake appears once, even when submitted twice.
- No CRM table is readable with the browser publishable key.
- Production secrets do not appear in browser bundles or logs.

## Production gate

Do not promote to the production domain until:

- Amanda's Auth user and allowlist entry exist,
- Supabase migrations are applied,
- Vercel secrets are configured,
- Auth redirect URLs are approved,
- webhook authentication is tested,
- and the GHL integration mode is intentionally selected.
