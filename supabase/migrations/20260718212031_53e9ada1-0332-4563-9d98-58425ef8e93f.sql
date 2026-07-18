
-- Revoke public read access to submitter PII on activities
REVOKE SELECT (submitter_email, submitter_name, submitted_by) ON public.activities FROM anon, authenticated;

-- Revoke public read access to reviewer user_id on activity_reviews
REVOKE SELECT (user_id) ON public.activity_reviews FROM anon, authenticated;
