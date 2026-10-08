# Dominus CRM — Superseded GHL Integration Blueprint

> **Superseded on 2026-10-09:** The approved direction is now a custom Dominus CRM inspired by
> GoHighLevel, not a GoHighLevel integration. This document is retained as historical context only.
> See `docs/custom-crm-build-plan.md` for the active plan.

## Goal

Create two clear website entry points while keeping the first release intentionally small:

1. Tax clients complete the existing client intake form.
2. Tax consultants complete the existing consultant onboarding form.
3. Each submission creates or updates the correct contact in GoHighLevel (GHL).
4. GHL owns pipeline status, follow-up, tasks, notes, and reporting.

This phase does **not** require a custom client portal, custom API, or a second lead database.

## System boundary

```text
Dominus website
  ├─ Tax Client Intake ───────┐
  └─ Consultant Application ──┼─> Jotform submission
                              └─> GHL contact + tags + pipeline opportunity
                                      ├─ email/SMS acknowledgement
                                      ├─ internal notification/task
                                      └─ team-managed follow-up
```

## Frontend

Implemented in this repository:

- A visible choice between **Tax Client** and **Consultant** journeys.
- Each CTA opens the correct form directly.
- Service cards route to the relevant journey.
- Form URLs are configurable with public environment variables.
- Existing Jotform embeds remain in use, avoiding unnecessary form duplication.
- Keyboard Escape and backdrop click close the form modal.

### Frontend configuration

| Variable | Purpose |
| --- | --- |
| `VITE_CLIENT_INTAKE_FORM_URL` | Tax client Jotform embed URL |
| `VITE_CONSULTANT_ONBOARDING_FORM_URL` | Consultant Jotform embed URL |

## Backend / automation

GHL should act as the lightweight backend. Configure two independent workflows.

### Workflow A — tax client

1. Trigger: client intake form submitted.
2. Find or create contact by email/phone.
3. Apply tag `source:website`.
4. Apply tag `journey:tax-client`.
5. Create opportunity in `Tax Client Pipeline` at `New Lead`.
6. Send acknowledgement email/SMS.
7. Notify the assigned internal user.
8. Create follow-up task if no appointment exists.

Suggested stages:

```text
New Lead → Contacted → Appointment Booked → Documents Pending
→ In Preparation → Review/Signature → Filed → Closed
```

### Workflow B — consultant

1. Trigger: consultant onboarding form submitted.
2. Find or create contact by email/phone.
3. Apply tag `source:website`.
4. Apply tag `journey:consultant`.
5. Create opportunity in `Consultant Pipeline` at `Application Received`.
6. Send application acknowledgement.
7. Notify the onboarding owner.
8. Create review task with the application link/notes.

Suggested stages:

```text
Application Received → Under Review → Interview/Call → Approved
→ Agreement/Payment → Account Setup → Training → Active
```

## Database / CRM fields

Use the GHL contact record as the source of truth. Do not copy the same lead into Supabase unless a future feature has a specific need for it.

### Shared fields

| Field | Type | Notes |
| --- | --- | --- |
| First name / last name | Standard | Required |
| Email | Standard | Primary deduplication field |
| Phone | Standard | Normalize to US format |
| Lead journey | Dropdown | `Tax Client` or `Consultant` |
| Lead source | Dropdown | Default `Website` |
| Consent timestamp | Date/time | Preserve form consent evidence |
| Original submission ID | Text | Jotform submission ID for traceability |

### Tax-client fields

- Filing type / service requested
- Tax year(s)
- Individual or business
- Preferred contact method
- Appointment status

### Consultant fields

- Business name
- PTIN / EFIN status where appropriate
- Experience level
- Software/training needs
- Agreement status
- Onboarding completion status

Sensitive tax documents, SSNs, banking data, and passwords should not be stored in general-purpose CRM notes.

## Integration options

Use the simplest option supported by the current accounts:

1. **Preferred:** native Jotform → GHL integration.
2. **Fallback:** Jotform → Make/Zapier → GHL.
3. **Later only if needed:** server-side webhook endpoint with signature verification and retry logging.

No GHL secret or webhook credential should ever be placed in frontend code or a `VITE_*` variable.

## Small implementation tasks

- Confirm final Jotform questions and required fields.
- Map every Jotform answer to a GHL standard/custom field.
- Create the two GHL pipelines and stages.
- Create tags using the naming convention above.
- Build and test both acknowledgement messages.
- Add internal assignment and notification rules.
- Test duplicate submissions with the same email/phone.
- Test mobile form completion and validation.
- Test error handling by temporarily disabling an integration step.
- Confirm consent language before enabling SMS automation.
- Publish only after test contacts reach the correct pipelines.

## Acceptance test

Phase 1 is ready when one test submission from each journey produces:

- the correct GHL contact,
- the correct journey/source tags,
- exactly one opportunity in the correct pipeline,
- the correct acknowledgement,
- an internal notification/task,
- and no duplicate contact on a repeated submission.
