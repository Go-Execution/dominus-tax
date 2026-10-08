-- Dominus 360 custom CRM foundation.
--
-- This migration intentionally models the operational CRM only. Tax returns, SSNs,
-- banking details, passwords, and raw taxpayer documents do not belong in these tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.crm_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 120),
  role text NOT NULL CHECK (role IN ('admin', 'consultant')),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 32),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 1000),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type text NOT NULL CHECK (contact_type IN ('tax-client', 'consultant')),
  first_name text NOT NULL CHECK (char_length(trim(first_name)) BETWEEN 1 AND 100),
  last_name text NOT NULL CHECK (char_length(trim(last_name)) BETWEEN 1 AND 100),
  email text CHECK (email IS NULL OR char_length(email) <= 254),
  email_normalized text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone text CHECK (phone IS NULL OR char_length(phone) <= 32),
  phone_e164 text CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  business_name text CHECK (business_name IS NULL OR char_length(business_name) <= 160),
  lead_source text NOT NULL DEFAULT 'website' CHECK (char_length(lead_source) <= 80),
  source_submission_id text CHECK (
    source_submission_id IS NULL OR char_length(source_submission_id) BETWEEN 1 AND 128
  ),
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_recorded_at timestamptz,
  assigned_to uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (marketing_consent = false OR consent_recorded_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_email
  ON public.crm_contacts(email_normalized)
  WHERE email_normalized IS NOT NULL AND is_archived = false;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_source_submission
  ON public.crm_contacts(source_submission_id)
  WHERE source_submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone_e164
  ON public.crm_contacts(phone_e164)
  WHERE phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_assignment
  ON public.crm_contacts(assigned_to, contact_type, is_archived);

CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  contact_type text NOT NULL CHECK (contact_type IN ('tax-client', 'consultant')),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  position integer NOT NULL CHECK (position >= 0),
  color text CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  requires_attention boolean NOT NULL DEFAULT false,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, slug),
  UNIQUE (pipeline_id, position)
);

CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE RESTRICT,
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  stage_id uuid NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  assigned_to uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'archived')),
  next_action text CHECK (next_action IS NULL OR char_length(next_action) <= 500),
  next_action_at timestamptz,
  last_activity_at timestamptz,
  closed_at timestamptz,
  created_by uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status IN ('won', 'lost', 'archived')) = (closed_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_open_opportunity_per_pipeline
  ON public.crm_opportunities(contact_id, pipeline_id)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_board
  ON public.crm_opportunities(pipeline_id, stage_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_owner
  ON public.crm_opportunities(assigned_to, status, next_action_at);

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  assigned_to uuid NOT NULL REFERENCES public.crm_profiles(user_id) ON DELETE RESTRICT,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_owner_queue
  ON public.crm_tasks(assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_contact
  ON public.crm_tasks(contact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  color text CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_tags_name ON public.crm_tags(lower(name));

CREATE TABLE IF NOT EXISTS public.crm_contact_tags (
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.crm_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.crm_tasks(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES public.crm_profiles(user_id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (char_length(trim(event_type)) BETWEEN 1 AND 80),
  summary text NOT NULL CHECK (char_length(trim(summary)) BETWEEN 1 AND 500),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (contact_id IS NOT NULL OR opportunity_id IS NOT NULL OR task_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_contact
  ON public.crm_activity_events(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activity_opportunity
  ON public.crm_activity_events(opportunity_id, created_at DESC);

-- Link the existing intake receiver to the new custom CRM without disrupting old records.
ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crm_opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_intake_submissions_crm_contact
  ON public.intake_submissions(crm_contact_id)
  WHERE crm_contact_id IS NOT NULL;

-- Seed the two approved Dominus workflows.
INSERT INTO public.crm_pipelines (slug, name, contact_type, position)
VALUES
  ('tax-client', 'Tax Client Pipeline', 'tax-client', 1),
  ('consultant-recruitment', 'Consultant Recruitment', 'consultant', 2)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  contact_type = EXCLUDED.contact_type,
  position = EXCLUDED.position,
  is_active = true;

INSERT INTO public.crm_pipeline_stages (
  pipeline_id, slug, name, position, color, requires_attention, is_closed
)
SELECT p.id, s.slug, s.name, s.position, s.color, s.requires_attention, s.is_closed
FROM public.crm_pipelines p
JOIN (
  VALUES
    ('tax-client', 'new-lead', 'New Lead', 1, '#D4AF37', false, false),
    ('tax-client', 'contacted', 'Contacted', 2, '#C9A96E', false, false),
    ('tax-client', 'appointment-booked', 'Appointment Booked', 3, '#4F8A8B', false, false),
    ('tax-client', 'intake-started', 'Intake Started', 4, '#2F7D6D', false, false),
    ('tax-client', 'documents-needed', 'Documents Needed', 5, '#C06C3B', true, false),
    ('tax-client', 'ready-for-preparation', 'Ready for Preparation', 6, '#38755B', false, false),
    ('tax-client', 'return-in-progress', 'Return in Progress', 7, '#305F72', false, false),
    ('tax-client', 'submitted', 'Submitted', 8, '#655D8A', false, false),
    ('tax-client', 'funded', 'Funded', 9, '#3D8361', false, false),
    ('tax-client', 'completed', 'Completed', 10, '#26634F', false, true),
    ('tax-client', 'follow-up', 'Follow-Up', 11, '#A36A2D', true, false),
    ('consultant-recruitment', 'application-received', 'Application Received', 1, '#D4AF37', false, false),
    ('consultant-recruitment', 'call-booked', 'Call Booked', 2, '#4F8A8B', false, false),
    ('consultant-recruitment', 'interviewed', 'Interviewed', 3, '#305F72', false, false),
    ('consultant-recruitment', 'accepted', 'Accepted', 4, '#38755B', false, false),
    ('consultant-recruitment', 'onboarding', 'Onboarding', 5, '#2F7D6D', false, false),
    ('consultant-recruitment', 'documents-pending', 'Documents Pending', 6, '#C06C3B', true, false),
    ('consultant-recruitment', 'ptin-verified', 'PTIN Verified', 7, '#3D8361', false, false),
    ('consultant-recruitment', 'training-in-progress', 'Training in Progress', 8, '#655D8A', false, false),
    ('consultant-recruitment', 'software-access-pending', 'Software Access Pending', 9, '#A36A2D', true, false),
    ('consultant-recruitment', 'active-tax-pro', 'Active Tax Pro', 10, '#26634F', false, true),
    ('consultant-recruitment', 'rejected-inactive', 'Rejected / Inactive', 11, '#6B6B6B', false, true)
) AS s(pipeline_slug, slug, name, position, color, requires_attention, is_closed)
  ON s.pipeline_slug = p.slug
ON CONFLICT (pipeline_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  color = EXCLUDED.color,
  requires_attention = EXCLUDED.requires_attention,
  is_closed = EXCLUDED.is_closed;

DROP TRIGGER IF EXISTS trg_crm_profiles_updated_at ON public.crm_profiles;
CREATE TRIGGER trg_crm_profiles_updated_at
BEFORE UPDATE ON public.crm_profiles
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated_at
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_pipelines_updated_at ON public.crm_pipelines;
CREATE TRIGGER trg_crm_pipelines_updated_at
BEFORE UPDATE ON public.crm_pipelines
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_pipeline_stages_updated_at ON public.crm_pipeline_stages;
CREATE TRIGGER trg_crm_pipeline_stages_updated_at
BEFORE UPDATE ON public.crm_pipeline_stages
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_opportunities_updated_at ON public.crm_opportunities;
CREATE TRIGGER trg_crm_opportunities_updated_at
BEFORE UPDATE ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_tasks_updated_at ON public.crm_tasks;
CREATE TRIGGER trg_crm_tasks_updated_at
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW EXECUTE FUNCTION public.crm_set_updated_at();

-- Access helpers are SECURITY DEFINER so policies cannot be bypassed by altering search_path.
CREATE OR REPLACE FUNCTION public.crm_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.crm_profiles
  WHERE user_id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.crm_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(public.crm_current_role() = 'admin', false)
$$;

ALTER TABLE public.crm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.crm_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_contacts FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_pipelines FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_pipeline_stages FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_opportunities FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_tasks FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_tags FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_contact_tags FROM anon, authenticated;
REVOKE ALL ON TABLE public.crm_activity_events FROM anon, authenticated;

-- Authenticated browser sessions are read-only. All mutations go through authenticated APIs.
GRANT SELECT ON TABLE public.crm_profiles TO authenticated;
GRANT SELECT ON TABLE public.crm_contacts TO authenticated;
GRANT SELECT ON TABLE public.crm_pipelines TO authenticated;
GRANT SELECT ON TABLE public.crm_pipeline_stages TO authenticated;
GRANT SELECT ON TABLE public.crm_opportunities TO authenticated;
GRANT SELECT ON TABLE public.crm_tasks TO authenticated;
GRANT SELECT ON TABLE public.crm_tags TO authenticated;
GRANT SELECT ON TABLE public.crm_contact_tags TO authenticated;
GRANT SELECT ON TABLE public.crm_activity_events TO authenticated;

GRANT ALL ON TABLE public.crm_profiles TO service_role;
GRANT ALL ON TABLE public.crm_contacts TO service_role;
GRANT ALL ON TABLE public.crm_pipelines TO service_role;
GRANT ALL ON TABLE public.crm_pipeline_stages TO service_role;
GRANT ALL ON TABLE public.crm_opportunities TO service_role;
GRANT ALL ON TABLE public.crm_tasks TO service_role;
GRANT ALL ON TABLE public.crm_tags TO service_role;
GRANT ALL ON TABLE public.crm_contact_tags TO service_role;
GRANT ALL ON TABLE public.crm_activity_events TO service_role;

DROP POLICY IF EXISTS crm_profiles_select ON public.crm_profiles;
CREATE POLICY crm_profiles_select ON public.crm_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.crm_is_admin());

DROP POLICY IF EXISTS crm_reference_pipelines_select ON public.crm_pipelines;
CREATE POLICY crm_reference_pipelines_select ON public.crm_pipelines
FOR SELECT TO authenticated
USING (public.crm_current_role() IS NOT NULL);

DROP POLICY IF EXISTS crm_reference_stages_select ON public.crm_pipeline_stages;
CREATE POLICY crm_reference_stages_select ON public.crm_pipeline_stages
FOR SELECT TO authenticated
USING (public.crm_current_role() IS NOT NULL);

DROP POLICY IF EXISTS crm_contacts_select ON public.crm_contacts;
CREATE POLICY crm_contacts_select ON public.crm_contacts
FOR SELECT TO authenticated
USING (public.crm_is_admin() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS crm_opportunities_select ON public.crm_opportunities;
CREATE POLICY crm_opportunities_select ON public.crm_opportunities
FOR SELECT TO authenticated
USING (public.crm_is_admin() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS crm_tasks_select ON public.crm_tasks;
CREATE POLICY crm_tasks_select ON public.crm_tasks
FOR SELECT TO authenticated
USING (public.crm_is_admin() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS crm_tags_select ON public.crm_tags;
CREATE POLICY crm_tags_select ON public.crm_tags
FOR SELECT TO authenticated
USING (public.crm_current_role() IS NOT NULL);

DROP POLICY IF EXISTS crm_contact_tags_select ON public.crm_contact_tags;
CREATE POLICY crm_contact_tags_select ON public.crm_contact_tags
FOR SELECT TO authenticated
USING (
  public.crm_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.crm_contacts c
    WHERE c.id = contact_id AND c.assigned_to = auth.uid()
  )
);

DROP POLICY IF EXISTS crm_activity_select ON public.crm_activity_events;
CREATE POLICY crm_activity_select ON public.crm_activity_events
FOR SELECT TO authenticated
USING (
  public.crm_is_admin()
  OR actor_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.crm_contacts c
    WHERE c.id = contact_id AND c.assigned_to = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.crm_opportunities o
    WHERE o.id = opportunity_id AND o.assigned_to = auth.uid()
  )
);

COMMENT ON TABLE public.crm_contacts IS
  'Dominus CRM contact profiles. Do not store SSNs, tax returns, banking data, or passwords.';
COMMENT ON TABLE public.crm_opportunities IS
  'Current pipeline position, ownership, priority, and next action for a contact.';
COMMENT ON TABLE public.crm_activity_events IS
  'Append-only operational audit trail written through trusted CRM APIs.';
