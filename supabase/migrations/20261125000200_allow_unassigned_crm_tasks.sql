-- Temporary-password administration has no crm_profiles row. Let the admin
-- create a follow-up task before a team member is assigned.
ALTER TABLE public.crm_tasks
  ALTER COLUMN assigned_to DROP NOT NULL;
