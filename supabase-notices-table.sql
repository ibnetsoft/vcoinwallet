-- Create notices table for announcements
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL CHECK (type IN ('IMPORTANT', 'NOTICE', 'INFO', 'EVENT', 'UPDATE')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_type ON public.notices(type);

-- Enable Row Level Security
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create policies for notices (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view notices"
  ON public.notices FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;

-- Verify the table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notices'
ORDER BY ordinal_position;
