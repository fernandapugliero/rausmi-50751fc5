
-- Sources table: Familienzentren we extract from
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  extra_urls TEXT[] NOT NULL DEFAULT '{}',
  district public.berlin_district NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  default_image_url TEXT,
  default_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sources"
  ON public.sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- source_runs: log every extraction execution
CREATE TABLE public.source_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running', -- running | success | failed | empty
  found_count INTEGER NOT NULL DEFAULT 0,
  new_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  raw_response JSONB,
  model TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

ALTER TABLE public.source_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view runs"
  ON public.source_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_source_runs_source ON public.source_runs(source_id, started_at DESC);

-- Extend activities with source linkage + dedupe key
ALTER TABLE public.activities
  ADD COLUMN source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  ADD COLUMN external_key TEXT,
  ADD COLUMN last_seen_at TIMESTAMPTZ;

CREATE UNIQUE INDEX uniq_activities_source_external_key
  ON public.activities(source_id, external_key)
  WHERE source_id IS NOT NULL AND external_key IS NOT NULL;

CREATE INDEX idx_activities_source ON public.activities(source_id);
