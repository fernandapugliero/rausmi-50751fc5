ALTER TABLE public.user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_activity_id_fkey;
ALTER TABLE public.user_bookmarks ALTER COLUMN activity_id TYPE text USING activity_id::text;