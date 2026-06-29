
-- Add double opt-in columns
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmation_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Existing rows: treat as already confirmed to avoid breaking them
UPDATE public.newsletter_subscribers
  SET confirmed_at = COALESCE(confirmed_at, created_at)
  WHERE confirmed_at IS NULL;

-- Replace the permissive INSERT policy with one that REQUIRES the row to start
-- unconfirmed and inactive. Activation only happens server-side (service_role)
-- after the user clicks the confirmation link in their email.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can request subscription (pending confirmation)"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_active = false
  AND confirmed_at IS NULL
  AND unsubscribed_at IS NULL
  AND confirmation_token IS NOT NULL
  AND char_length(email) BETWEEN 3 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND array_length(districts, 1) BETWEEN 1 AND 10
);
