ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS duplicate_of_activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_location_time
  ON public.activities (location_name, start_time)
  WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_activities_duplicate_of
  ON public.activities (duplicate_of_activity_id)
  WHERE duplicate_of_activity_id IS NOT NULL;