
-- Remove the broad public SELECT policy on crawler_overrides; the existing
-- "Admins can manage overrides" (FOR ALL) policy already covers admin reads.
DROP POLICY IF EXISTS "Anyone can read overrides" ON public.crawler_overrides;
