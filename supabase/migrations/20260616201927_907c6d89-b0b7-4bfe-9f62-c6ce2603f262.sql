CREATE TABLE public.activity_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id text NOT NULL,
  activity_title text,
  activity_source_url text,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_role text NOT NULL CHECK (reporter_role IN ('visitor','organizer')),
  issues text[] NOT NULL DEFAULT '{}',
  comment text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_reports TO authenticated;
GRANT ALL ON public.activity_reports TO service_role;

ALTER TABLE public.activity_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can submit reports"
  ON public.activity_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Users can view their own reports"
  ON public.activity_reports
  FOR SELECT
  TO authenticated
  USING (reporter_user_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.activity_reports
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
  ON public.activity_reports
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
  ON public.activity_reports
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_activity_reports_updated_at
  BEFORE UPDATE ON public.activity_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_activity_reports_status_created ON public.activity_reports (status, created_at DESC);
CREATE INDEX idx_activity_reports_activity_id ON public.activity_reports (activity_id);