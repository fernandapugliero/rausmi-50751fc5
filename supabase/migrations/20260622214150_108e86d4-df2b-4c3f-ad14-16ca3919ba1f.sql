
-- 1. SECURITY DEFINER function exposure: lock down EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Tighten always-true INSERT policies

-- 2a. activities: allow anonymous submissions but force pending + ban admin/back-office fields
DROP POLICY IF EXISTS "Anyone can submit activities" ON public.activities;
CREATE POLICY "Anyone can submit activities"
  ON public.activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_approved = false
    AND source IS DISTINCT FROM 'ai-extraction'
    AND source_id IS NULL
    AND duplicate_of_activity_id IS NULL
    AND char_length(title) BETWEEN 1 AND 200
    AND char_length(location_name) BETWEEN 1 AND 200
    AND (submitter_email IS NULL OR char_length(submitter_email) <= 254)
    AND (submitter_name IS NULL OR char_length(submitter_name) <= 120)
    AND (submitted_by IS NULL OR submitted_by = auth.uid())
  );

-- 2b. kindercafes: force pending + non-sponsored, ownership when signed in
DROP POLICY IF EXISTS "Users can submit kindercafes" ON public.kindercafes;
CREATE POLICY "Users can submit kindercafes"
  ON public.kindercafes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_approved = false
    AND is_sponsored = false
    AND submitted_by = auth.uid()
    AND char_length(name) BETWEEN 1 AND 200
    AND (contact_email IS NULL OR char_length(contact_email) <= 254)
  );

-- 2c. newsletter_subscribers: meaningful constraints on insert
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_active = true
    AND unsubscribed_at IS NULL
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- 3. user_roles: explicit admin-only INSERT/DELETE (UPDATE intentionally not allowed)
CREATE POLICY "Admins can grant roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can revoke roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow each user to read their own roles (needed so non-admins can know their roles
-- without needing has_role to bypass RLS for anon)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Sensitive column exposure: hide PII from anonymous visitors at column level
REVOKE SELECT (submitter_email, submitter_name, submitted_by) ON public.activities FROM anon;
REVOKE SELECT (contact_email) ON public.kindercafes FROM anon;

-- 5. Storage: scope uploads to per-user folder and remove broad listing policy
DROP POLICY IF EXISTS "Auth users upload kindercafe photos" ON storage.objects;
CREATE POLICY "Auth users upload kindercafe photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kindercafe-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Remove broad SELECT policy that allows listing; public bucket URLs still serve files directly
DROP POLICY IF EXISTS "Public read kindercafe photos" ON storage.objects;
