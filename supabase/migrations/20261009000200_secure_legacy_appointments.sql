-- The current website uses Calendly/Jotform and does not require direct public access to the
-- legacy appointments table. Remove the original broad anonymous policies before production.

DROP POLICY IF EXISTS "anon_select_appointments" ON public.appointments;
DROP POLICY IF EXISTS "anon_insert_appointments" ON public.appointments;

REVOKE ALL ON TABLE public.appointments FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO service_role;
