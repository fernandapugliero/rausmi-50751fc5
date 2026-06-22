
-- Move has_role into a private schema so it is not callable via PostgREST,
-- but is still usable from RLS policies (which run inside the database).
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate every policy that referenced public.has_role to reference private.has_role
-- activity_reports
DROP POLICY IF EXISTS "Admins can delete reports" ON public.activity_reports;
CREATE POLICY "Admins can delete reports" ON public.activity_reports
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update reports" ON public.activity_reports;
CREATE POLICY "Admins can update reports" ON public.activity_reports
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all reports" ON public.activity_reports;
CREATE POLICY "Admins can view all reports" ON public.activity_reports
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- kindercafes
DROP POLICY IF EXISTS "Admins can manage kindercafes" ON public.kindercafes;
CREATE POLICY "Admins can manage kindercafes" ON public.kindercafes
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- activity_reviews
DROP POLICY IF EXISTS "Users can delete their own reviews or admins can delete any" ON public.activity_reviews;
CREATE POLICY "Users can delete their own reviews or admins can delete any" ON public.activity_reviews
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- newsletter_subscribers
DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- activities
DROP POLICY IF EXISTS "Admins can manage all activities" ON public.activities;
CREATE POLICY "Admins can manage all activities" ON public.activities
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can grant roles" ON public.user_roles;
CREATE POLICY "Admins can grant roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;
CREATE POLICY "Admins can revoke roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- sources
DROP POLICY IF EXISTS "Admins manage sources" ON public.sources;
CREATE POLICY "Admins manage sources" ON public.sources
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- source_runs
DROP POLICY IF EXISTS "Admins view runs" ON public.source_runs;
CREATE POLICY "Admins view runs" ON public.source_runs
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- crawler_overrides
DROP POLICY IF EXISTS "Admins can manage overrides" ON public.crawler_overrides;
CREATE POLICY "Admins can manage overrides" ON public.crawler_overrides
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- storage admin policies
DROP POLICY IF EXISTS "Admins delete kindercafe photos" ON storage.objects;
CREATE POLICY "Admins delete kindercafe photos" ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'kindercafe-photos') AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Now we can safely drop the public.has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
