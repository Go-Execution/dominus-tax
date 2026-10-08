# Dominus Local Intake API

This local-only service proves the future Jotform → GHL workflow without deploying or transmitting lead data.

## Run locally

```powershell
npm run dev:api
```

The API listens on `http://127.0.0.1:8787` by default. The Vite dev server proxies `/api` requests to it.

Optional configuration:

```powershell
Copy-Item .env.server.example .env.server
```

`.env.server` and `.local-data/` are intentionally ignored by Git.

## Endpoints

### Health

```http
GET /health
```

### Receive intake

```http
POST /api/intake
Content-Type: application/json
```

Example development payload:

```json
{
  "sourceSubmissionId": "jotform-development-001",
  "journey": "consultant",
  "firstName": "Development",
  "lastName": "Consultant",
  "email": "development@example.com",
  "phone": "4325550100",
  "consent": true,
  "submittedAt": "2026-10-08T12:00:00.000Z",
  "details": {
    "experience": "2 years"
  }
}
```

The default adapter is a local mock. It creates deterministic mock GHL IDs and never sends the payload outside the computer.

### Amanda dashboard

With both local processes running, open:

```text
http://127.0.0.1:5173/#admin
```

The dashboard reads:

```http
GET /api/admin/dashboard
```

Pipeline stage changes use:

```http
PATCH /api/admin/submissions/:id/stage
Content-Type: application/json

{ "stage": "documents-pending" }
```

The admin endpoints are intentionally local-only and have no production authentication yet. Do not deploy the API until owner authentication and authorization are implemented.

## Local database

The SQLite database contains only:

- source submission ID,
- journey type,
- one-way email hash,
- last four phone digits,
- consent flag,
- sync status,
- mock/external record IDs,
- timestamps and integration event status.

Names, full email addresses, full phone numbers, arbitrary answers, documents, SSNs, passwords, and tax data are not persisted.

## Verification

```powershell
npm run test:api
npm run typecheck:api
```

## Live integration boundary

Before enabling a real GHL adapter:

1. Confirm the two GHL pipelines and custom fields.
2. Confirm Jotform webhook/integration payload mapping.
3. Add server-side GHL credentials to `.env.server`.
4. Implement and test the reviewed live adapter.
5. Keep `GHL_INTEGRATION_MODE=mock` until Amanda approves a controlled test contact.
