-- =====================================================
-- V COIN 월렛 - Supabase 데이터베이스 스키마
-- =====================================================
-- 이 SQL 파일을 Supabase SQL Editor에서 실행하세요.
-- =====================================================

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    member_number INTEGER UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    security_coins INTEGER DEFAULT 0 NOT NULL,
    dividend_coins INTEGER DEFAULT 0 NOT NULL,
    role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'TEAM_LEADER', 'USER')),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. transactions 테이블 생성
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('SIGNUP_BONUS', 'REFERRAL_BONUS', 'ADMIN_GRANT', 'CONVERSION')),
    coin_type TEXT NOT NULL CHECK (coin_type IN ('SECURITY', 'DIVIDEND')),
    amount INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. metadata 테이블 생성 (다음 회원번호 등 저장)
CREATE TABLE IF NOT EXISTS public.metadata (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_member_number ON public.users(member_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_coin_type ON public.transactions(coin_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- 5. Row Level Security (RLS) 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (auth.uid()::text = id);

-- 사용자는 자신의 거래내역만 조회 가능
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- 관리자는 모든 데이터 조회 가능 (서비스 롤 키 사용)
-- API 라우트에서 supabaseAdmin을 사용하면 RLS를 우회합니다.

-- 6. 초기 메타데이터 삽입
INSERT INTO public.metadata (key, value)
VALUES ('next_member_number', 1)
ON CONFLICT (key) DO NOTHING;

-- 7. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_metadata_updated_at
    BEFORE UPDATE ON public.metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 마이그레이션 확인 쿼리
-- =====================================================
-- 데이터가 제대로 들어갔는지 확인하세요:

-- SELECT COUNT(*) as user_count FROM public.users;
-- SELECT COUNT(*) as transaction_count FROM public.transactions;
-- SELECT * FROM public.metadata;

-- =====================================================
-- 테스트 쿼리 예시
-- =====================================================

-- 모든 사용자 조회 (최신 10명)
-- SELECT id, member_number, name, email, security_coins, dividend_coins, role, created_at
-- FROM public.users
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 특정 사용자의 거래내역 조회
-- SELECT t.*, u.name as user_name
-- FROM public.transactions t
-- JOIN public.users u ON t.user_id = u.id
-- WHERE t.user_id = 'user_id_here'
-- ORDER BY t.created_at DESC;

-- 추천인별 가입자 수 통계
-- SELECT
--     u1.name as referrer_name,
--     u1.referral_code,
--     COUNT(u2.id) as referred_count
-- FROM public.users u1
-- LEFT JOIN public.users u2 ON u2.referred_by = u1.referral_code
-- GROUP BY u1.id, u1.name, u1.referral_code
-- HAVING COUNT(u2.id) > 0
-- ORDER BY referred_count DESC;
