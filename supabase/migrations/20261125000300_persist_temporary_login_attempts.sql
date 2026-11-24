-- Rate-limit the shared temporary administrator password across Vercel
-- function instances. Store only a keyed hash of the client IP.
CREATE TABLE IF NOT EXISTS public.crm_temp_login_attempts (
  key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  failure_count integer NOT NULL CHECK (failure_count BETWEEN 0 AND 1000000),
  reset_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_temp_login_attempts_reset_at
  ON public.crm_temp_login_attempts (reset_at);

ALTER TABLE public.crm_temp_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_temp_login_attempts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.crm_temp_login_attempt(
  p_key_hash text,
  p_success boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_failures integer;
BEGIN
  IF p_key_hash IS NULL OR p_key_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid login attempt key' USING ERRCODE = '22023';
  END IF;

  IF p_success THEN
    DELETE FROM public.crm_temp_login_attempts WHERE key_hash = p_key_hash;
    RETURN 0;
  END IF;

  INSERT INTO public.crm_temp_login_attempts (key_hash, failure_count, reset_at)
  VALUES (p_key_hash, 1, now() + interval '15 minutes')
  ON CONFLICT (key_hash) DO UPDATE SET
    failure_count = CASE
      WHEN crm_temp_login_attempts.reset_at <= now() THEN 1
      ELSE least(crm_temp_login_attempts.failure_count + 1, 1000000)
    END,
    reset_at = CASE
      WHEN crm_temp_login_attempts.reset_at <= now() THEN now() + interval '15 minutes'
      ELSE crm_temp_login_attempts.reset_at
    END
  RETURNING failure_count INTO v_failures;

  RETURN v_failures;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_temp_login_attempt(text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_temp_login_attempt(text, boolean)
  TO service_role;
