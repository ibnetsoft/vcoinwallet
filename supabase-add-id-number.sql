-- Add id_number (주민등록번호) column to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_id_number ON public.users(id_number);

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id_number';
