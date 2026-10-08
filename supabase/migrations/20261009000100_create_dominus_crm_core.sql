-- Dominus CRM metadata tables.
-- Raw form answers, tax documents, SSNs, passwords, and full contact details are intentionally
-- excluded. The server uses a Supabase secret/service-role key; browsers receive no table access.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_submission_id text NOT NULL UNIQUE CHECK (char_length(source_submission_id) BETWEEN 1 AND 128),
  journey text NOT NULL CHECK (journey IN ('tax-client', 'consultant')),
  email_hash text NOT NULL CHECK (char_length(email_hash) = 64),
  phone_last_four text NOT NULL CHECK (char_length(phone_last_four) = 4),
  consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'synced', 'failed')),
  stage text NOT NULL CHECK (stage IN (
    'new-lead',
    'contacted',
    'appointment-booked',
    'documents-needed',
    'ready-for-preparation',
    'submitted',
    'funded',
    'closed',
    'form-submitted',
    'documents-pending',
    'ptin-verification',
    'training-in-progress',
    'software-access-pending',
    'ready-to-prepare-returns'
  )),
  external_contact_id text,
  external_opportunity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.intake_submissions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL,
  message text CHECK (message IS NULL OR char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_journey_status
  ON public.intake_submissions(journey, status);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_stage
  ON public.intake_submissions(stage);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_created_at
  ON public.intake_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_events_submission_id
  ON public.integration_events(submission_id, created_at DESC);

ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- The browser must never read or mutate CRM metadata directly.
REVOKE ALL ON TABLE public.intake_submissions FROM anon, authenticated;
REVOKE ALL ON TABLE public.integration_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;

-- Vercel Functions use the server-only secret/service-role key.
GRANT SELECT, INSERT, UPDATE ON TABLE public.intake_submissions TO service_role;
GRANT SELECT, INSERT ON TABLE public.integration_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_users TO service_role;

COMMENT ON TABLE public.intake_submissions IS
  'Privacy-minimized CRM workflow metadata managed by authenticated server functions.';
COMMENT ON TABLE public.integration_events IS
  'Audit events for intake and external CRM synchronization.';
COMMENT ON TABLE public.admin_users IS
  'Allowlist of Supabase Auth users permitted to access Amanda dashboard APIs.';
