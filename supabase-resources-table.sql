-- Create resources table for file board
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL CHECK (type IN ('IMPORTANT', 'NOTICE', 'INFO', 'EVENT', 'UPDATE')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,

  -- File related fields
  file_url TEXT,           -- Supabase Storage URL
  file_name TEXT,          -- Original file name
  file_size INTEGER,       -- File size in bytes
  file_type TEXT,          -- MIME type (e.g., application/pdf, image/jpeg)

  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view resources"
  ON public.resources FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;

-- Create storage bucket for resource files
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (public read, service_role write)
CREATE POLICY "Public can view resource files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY "Service role can manage resource files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'resources');

-- Add board settings to metadata table
-- Note: metadata.value is integer type, so we only store the file size
-- board_name will use default value '게시판' in the application
INSERT INTO public.metadata (key, value)
VALUES
  ('board_max_file_size', 10485760)  -- 10MB in bytes
ON CONFLICT (key) DO NOTHING;

-- Create functions for incrementing counters
CREATE OR REPLACE FUNCTION increment_resource_view(resource_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET view_count = view_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_resource_download(resource_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET download_count = download_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
