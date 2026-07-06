
-- 1) Replace overly permissive INSERT policy on pwa_install_events with validated check
DROP POLICY IF EXISTS "Anyone can insert install events" ON public.pwa_install_events;
CREATE POLICY "Anyone can insert install events"
  ON public.pwa_install_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('prompt_shown','prompt_accepted','prompt_dismissed','installed','standalone_open')
    AND (platform IS NULL OR char_length(platform) <= 32)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  );

-- 2) Hide submitter PII on activities from public/authenticated Data API reads.
--    Admin panel reads via SECURITY DEFINER RPC (admin_list_activities), which bypasses column grants.
REVOKE SELECT (submitter_email, submitter_name) ON public.activities FROM anon, authenticated;

-- 3) Hide raw user_id on activity_reviews from public Data API reads.
--    Clients only select id/rating/comment/display_name/created_at.
REVOKE SELECT (user_id) ON public.activity_reviews FROM anon, authenticated;
