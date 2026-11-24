-- Keep CRM policy helpers callable by signed-in users, but not by anonymous
-- PostgREST callers. PostgreSQL grants EXECUTE to PUBLIC by default.
REVOKE EXECUTE ON FUNCTION public.crm_current_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crm_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_current_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_is_admin() TO authenticated, service_role;

-- This function is only invoked by its database event trigger.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
