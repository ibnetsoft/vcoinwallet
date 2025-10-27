-- =====================================================
-- Add status column to users table
-- =====================================================

-- 1. status 컬럼 추가 (아직 없는 경우)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE'
CHECK (status IN ('ACTIVE', 'BLOCKED', 'DELETED'));

-- 2. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 3. 기존 사용자들의 status를 ACTIVE로 설정
UPDATE public.users
SET status = 'ACTIVE'
WHERE status IS NULL;

-- 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'status';
