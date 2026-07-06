
CREATE TABLE public.pwa_install_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('prompt_shown','prompt_accepted','prompt_dismissed','installed','standalone_open')),
  platform text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pwa_install_events TO anon, authenticated;
GRANT ALL ON public.pwa_install_events TO service_role;
ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert install events" ON public.pwa_install_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read install events" ON public.pwa_install_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
