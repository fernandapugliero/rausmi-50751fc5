-- 1) user_activity_views
CREATE TABLE public.user_activity_views (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_id)
);
CREATE INDEX user_activity_views_recent_idx ON public.user_activity_views (user_id, viewed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity_views TO authenticated;
GRANT ALL ON public.user_activity_views TO service_role;
ALTER TABLE public.user_activity_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own views select" ON public.user_activity_views FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own views insert" ON public.user_activity_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own views update" ON public.user_activity_views FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own views delete" ON public.user_activity_views FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2) weather_suitability
DO $$ BEGIN
  CREATE TYPE public.weather_suit AS ENUM ('indoor','outdoor','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS weather_suitability public.weather_suit NOT NULL DEFAULT 'both';

-- Backfill: outdoor
UPDATE public.activities SET weather_suitability = 'outdoor'
  WHERE lower(coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(location_name,''))
    ~ '(park|spielplatz|draußen|draussen|freibad|garten|wiese|hof|open.?air|freilicht|wald|see)';

-- Backfill: indoor (only if still 'both')
UPDATE public.activities SET weather_suitability = 'indoor'
  WHERE weather_suitability = 'both'
    AND lower(coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(location_name,''))
    ~ '(halle|bibliothek|zentrum|café|cafe|kirche|hallenbad|indoor|drinnen|saal|museum|kita|familienzentrum|nachbarschaftshaus)';
