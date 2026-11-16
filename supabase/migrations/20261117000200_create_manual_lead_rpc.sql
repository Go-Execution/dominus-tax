-- Create a manual contact, first opportunity, and audit event in one transaction.
-- Only the trusted server role may call this function.
CREATE OR REPLACE FUNCTION public.crm_create_manual_lead(
  p_contact_type text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS TABLE (contact_id uuid, opportunity_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pipeline_id uuid;
  v_stage_id uuid;
  v_contact_id uuid;
  v_opportunity_id uuid;
  v_pipeline_slug text;
  v_stage_slug text;
BEGIN
  IF p_contact_type NOT IN ('tax-client', 'consultant') THEN
    RAISE EXCEPTION 'Unsupported contact journey' USING ERRCODE = '22023';
  END IF;
  IF p_email IS NULL OR char_length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required' USING ERRCODE = '22023';
  END IF;
  IF p_assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.crm_profiles
    WHERE user_id = p_assigned_to AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Assignee is not active' USING ERRCODE = '22023';
  END IF;

  v_pipeline_slug := CASE WHEN p_contact_type = 'consultant'
    THEN 'consultant-recruitment' ELSE 'tax-client' END;
  v_stage_slug := CASE WHEN p_contact_type = 'consultant'
    THEN 'application-received' ELSE 'new-lead' END;

  SELECT id INTO v_pipeline_id FROM public.crm_pipelines
  WHERE slug = v_pipeline_slug AND contact_type = p_contact_type AND is_active = true;
  IF v_pipeline_id IS NULL THEN
    RAISE EXCEPTION 'CRM pipeline is unavailable' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_stage_id FROM public.crm_pipeline_stages
  WHERE pipeline_id = v_pipeline_id AND slug = v_stage_slug;
  IF v_stage_id IS NULL THEN
    RAISE EXCEPTION 'CRM starting stage is unavailable' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.crm_contacts (
    contact_type, first_name, last_name, email, phone, lead_source,
    assigned_to, created_by
  ) VALUES (
    p_contact_type, trim(p_first_name), trim(p_last_name), lower(trim(p_email)),
    nullif(trim(p_phone), ''), 'manual', p_assigned_to, p_actor_user_id
  ) RETURNING id INTO v_contact_id;

  INSERT INTO public.crm_opportunities (
    contact_id, pipeline_id, stage_id, title, assigned_to, priority,
    next_action, next_action_at, last_activity_at, created_by
  ) VALUES (
    v_contact_id, v_pipeline_id, v_stage_id,
    trim(p_first_name) || ' ' || trim(p_last_name) ||
      CASE WHEN p_contact_type = 'consultant' THEN ' — Consultant' ELSE ' — Tax Client' END,
    p_assigned_to, 'normal',
    CASE WHEN p_contact_type = 'consultant'
      THEN 'Review consultant application' ELSE 'Contact new tax lead' END,
    now() + interval '1 day', now(), p_actor_user_id
  ) RETURNING id INTO v_opportunity_id;

  INSERT INTO public.crm_activity_events (
    contact_id, opportunity_id, actor_user_id, event_type, summary
  ) VALUES (
    v_contact_id, v_opportunity_id, p_actor_user_id,
    'lead.created', 'Lead added manually'
  );

  RETURN QUERY SELECT v_contact_id, v_opportunity_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_create_manual_lead(text, text, text, text, text, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_create_manual_lead(text, text, text, text, text, uuid, uuid)
  TO service_role;
