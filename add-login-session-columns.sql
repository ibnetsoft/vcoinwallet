-- 동시 로그인 방지를 위한 세션 정보 컬럼 추가

-- users 테이블에 로그인 IP와 시간 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_last_login_ip ON users(last_login_ip);

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('last_login_ip', 'last_login_at');
