
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS pause_from DATE,
  ADD COLUMN IF NOT EXISTS pause_until DATE;

-- Backfill pause windows from description text like "Sommerpause 10.8.-21.8.2026"
WITH parsed AS (
  SELECT
    id,
    (regexp_match(
      description,
      '(?:Sommer|Winter|Oster|Weihnachts|Ferien)?pause[^0-9]{0,15}(\d{1,2})\.(\d{1,2})\.?(?:(\d{4}))?\s*[-––]\s*(\d{1,2})\.(\d{1,2})\.?(\d{4})?',
      'i'
    )) AS m
  FROM public.activities
  WHERE description IS NOT NULL
)
UPDATE public.activities a
SET
  pause_from  = make_date(coalesce(p.m[3], p.m[6], to_char(now(),'YYYY'))::int, p.m[2]::int, p.m[1]::int),
  pause_until = make_date(coalesce(p.m[6], p.m[3], to_char(now(),'YYYY'))::int, p.m[5]::int, p.m[4]::int)
FROM parsed p
WHERE a.id = p.id AND p.m IS NOT NULL;

-- Strip the ⚠️ note line from description (single trailing or standalone line)
UPDATE public.activities
SET description = NULLIF(trim(
  regexp_replace(description, '(\n\n)?⚠️[^\n]*', '', 'g')
), '')
WHERE description ILIKE '%⚠️%';
