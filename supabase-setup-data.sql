-- =====================================================
-- Supabase 데이터베이스 초기 데이터 설정
-- =====================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 기존 데이터 삭제 (있다면)
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.users CASCADE;
DELETE FROM public.metadata WHERE key = 'next_member_number';

-- 2. metadata 초기화
INSERT INTO public.metadata (key, value, updated_at)
VALUES ('next_member_number', 3, NOW())
ON CONFLICT (key) DO UPDATE SET value = 3, updated_at = NOW();

-- 3. 관리자 계정 추가
INSERT INTO public.users (
  id, member_number, email, password, name, phone,
  referral_code, security_coins, dividend_coins,
  role, is_admin, created_at
) VALUES (
  '1',
  0,
  'admin@3dvcoin.com',
  '123qwe',  -- 평문 비밀번호
  '관리자',
  '01000000000',
  'ADMIN1',
  0,
  0,
  'ADMIN',
  true,
  '2025-10-23T07:26:10.626Z'
);

-- 4. 일반 사용자 추가 (태양광 - 팀장)
INSERT INTO public.users (
  id, member_number, email, password, name, phone,
  referral_code, security_coins, dividend_coins,
  role, is_admin, created_at
) VALUES (
  '1761536398367',
  1,
  '',
  'test1234',  -- 평문 비밀번호
  '태양광',
  '01012345678',
  'DZ6H6S',
  1500,
  11000,
  'TEAM_LEADER',
  false,
  '2025-10-27T03:39:58.656Z'
);

-- 5. 일반 사용자 추가 (테스트 - 일반회원)
INSERT INTO public.users (
  id, member_number, email, password, name, phone,
  referral_code, referred_by, security_coins, dividend_coins,
  role, is_admin, status, created_at
) VALUES (
  '1761548090741',
  2,
  '',
  'test1234',  -- 평문 비밀번호
  '테스트',
  '01012341234',
  'CTYGVK',
  'DZ6H6S',  -- 태양광이 추천인
  500,
  10000,
  'USER',
  false,
  'ACTIVE',
  '2025-10-27T06:54:51.032Z'
);

-- 6. 거래 내역 추가
-- 태양광 가입 보너스
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761536398656',
  '1761536398367',
  'SIGNUP_BONUS',
  'SECURITY',
  500,
  500,
  '회원가입 보너스 (회원번호: 1)',
  '2025-10-27T03:39:58.656Z'
);

-- 태양광 배당코인 구매
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761539077186',
  '1761536398367',
  'ADMIN_GRANT',
  'DIVIDEND',
  10000,
  10000,
  '100만원 입금 - 배당코인 10000개',
  '2025-10-27T04:24:37.186Z'
);

-- 테스트 가입 보너스
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761548091032',
  '1761548090741',
  'SIGNUP_BONUS',
  'SECURITY',
  500,
  500,
  '회원가입 보너스 (회원번호: 2)',
  '2025-10-27T06:54:51.032Z'
);

-- 태양광 추천 보너스 (테스트 가입)
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761548091033',
  '1761536398367',
  'REFERRAL_BONUS',
  'SECURITY',
  1000,
  1500,
  '추천 보너스 - 테스트님 가입',
  '2025-10-27T06:54:51.032Z'
);

-- 테스트 배당코인 구매
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761548181704',
  '1761548090741',
  'ADMIN_GRANT',
  'DIVIDEND',
  10000,
  10000,
  '100만원 입금 - 배당코인 10000개',
  '2025-10-27T06:56:21.704Z'
);

-- 태양광 추천 보너스 (테스트 배당코인 구매)
INSERT INTO public.transactions (
  id, user_id, type, coin_type, amount, balance, description, created_at
) VALUES (
  '1761548181705',
  '1761536398367',
  'REFERRAL_BONUS',
  'DIVIDEND',
  1000,
  11000,
  '추천 보너스 - 테스트님 배당코인 구매',
  '2025-10-27T06:56:21.704Z'
);

-- =====================================================
-- 확인 쿼리
-- =====================================================
-- 데이터가 제대로 들어갔는지 확인:

SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'Metadata', COUNT(*) FROM public.metadata;

-- 모든 사용자 확인
SELECT id, member_number, name, phone, password, role, security_coins, dividend_coins
FROM public.users
ORDER BY member_number;
