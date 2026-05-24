
WITH norm AS (
  SELECT
    id,
    title,
    location_name,
    district,
    source,
    is_approved,
    regexp_replace(
      lower(translate(coalesce(title,''),
        'áàâãäåçéèêëíìîïñóòôõöúùûüýÿÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝ',
        'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY')),
      '[^a-z0-9]+', ' ', 'g'
    ) AS norm_title,
    regexp_replace(
      lower(translate(coalesce(location_name,''),
        'áàâãäåçéèêëíìîïñóòôõöúùûüýÿÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝ',
        'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY')),
      '[^a-z0-9]+', ' ', 'g'
    ) AS norm_loc
  FROM public.activities
  WHERE is_approved = true
),
matches AS (
  SELECT
    ai.id AS ai_id,
    leg.id AS legacy_id
  FROM norm ai
  JOIN norm leg
    ON ai.district = leg.district
   AND ai.id <> leg.id
   AND trim(ai.norm_title) = trim(leg.norm_title)
   AND (
     trim(ai.norm_loc) = trim(leg.norm_loc)
     OR position(trim(ai.norm_loc) in trim(leg.norm_loc)) > 0
     OR position(trim(leg.norm_loc) in trim(ai.norm_loc)) > 0
   )
  WHERE ai.source = 'ai-extraction'
    AND leg.source = 'legacy-json'
)
UPDATE public.activities a
SET is_approved = false,
    duplicate_of_activity_id = m.legacy_id,
    updated_at = now()
FROM matches m
WHERE a.id = m.ai_id;
