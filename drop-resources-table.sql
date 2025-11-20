-- Drop existing resources table and related objects
DROP TABLE IF EXISTS public.resources CASCADE;
DROP FUNCTION IF EXISTS increment_resource_view(TEXT);
DROP FUNCTION IF EXISTS increment_resource_download(TEXT);
DROP FUNCTION IF EXISTS increment_resource_view(UUID);
DROP FUNCTION IF EXISTS increment_resource_download(UUID);

-- Delete board_max_file_size from metadata if exists
DELETE FROM public.metadata WHERE key = 'board_max_file_size';

-- Remove storage bucket (execute this in Supabase Storage UI or separately)
-- DELETE FROM storage.buckets WHERE id = 'resources';
