
DROP FUNCTION IF EXISTS public.admin_list_activities();

CREATE OR REPLACE FUNCTION private.admin_list_activities()
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

REVOKE ALL ON FUNCTION private.admin_list_activities() FROM PUBLIC, anon, authenticated;

-- Public wrapper so PostgREST can expose it, but it just delegates
CREATE OR REPLACE FUNCTION public.admin_list_activities()
RETURNS SETOF public.activities
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.admin_list_activities();
$$;

REVOKE ALL ON FUNCTION public.admin_list_activities() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_activities() TO authenticated;
