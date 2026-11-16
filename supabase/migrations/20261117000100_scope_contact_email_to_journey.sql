-- A person may independently be a tax client and a consultant.
-- Keep each journey's contact and opportunity separate when an email matches.
DROP INDEX IF EXISTS public.uq_crm_contacts_email;

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_journey_email
  ON public.crm_contacts (contact_type, email_normalized)
  WHERE email_normalized IS NOT NULL AND is_archived = false;
