
CREATE TABLE public.activity_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id TEXT NOT NULL,
  activity_title TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 2000),
  display_name TEXT CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_reviews_activity_id_created_idx ON public.activity_reviews(activity_id, created_at DESC);

GRANT SELECT ON public.activity_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_reviews TO authenticated;
GRANT ALL ON public.activity_reviews TO service_role;

ALTER TABLE public.activity_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.activity_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create their own reviews"
  ON public.activity_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.activity_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews or admins can delete any"
  ON public.activity_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_activity_reviews_updated_at
  BEFORE UPDATE ON public.activity_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
