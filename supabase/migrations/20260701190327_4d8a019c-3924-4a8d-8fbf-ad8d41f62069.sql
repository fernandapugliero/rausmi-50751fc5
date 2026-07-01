
-- Hide submitter PII from public/authenticated SELECT on activities.
-- Admins will access full rows via an RPC that runs as SECURITY DEFINER.
REVOKE SELECT (submitter_email, submitter_name) ON public.activities FROM anon, authenticated;

-- Admin-only RPC to fetch activities incl. submitter PII
CREATE OR REPLACE FUNCTION public.admin_list_activities()
RETURNS SETOF public.activities
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.activities ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_activities() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_activities() TO authenticated;
