
-- 1) activity_reviews.user_id: remove from anon/public reads
REVOKE SELECT (user_id) ON public.activity_reviews FROM anon;
REVOKE SELECT (user_id) ON public.activity_reviews FROM authenticated;
GRANT SELECT (user_id) ON public.activity_reviews TO service_role;

-- 2) kindercafes.contact_email: remove from anon reads
REVOKE SELECT (contact_email) ON public.kindercafes FROM anon;
GRANT SELECT (contact_email) ON public.kindercafes TO authenticated;
GRANT SELECT (contact_email) ON public.kindercafes TO service_role;

-- 3) storage UPDATE policy for kindercafe-photos
DROP POLICY IF EXISTS "Auth users update own kindercafe photos" ON storage.objects;
CREATE POLICY "Auth users update own kindercafe photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kindercafe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'kindercafe-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
