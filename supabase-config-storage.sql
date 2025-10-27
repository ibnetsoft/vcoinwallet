-- =====================================================
-- 시스템 설정을 metadata 테이블에 저장
-- =====================================================

-- 1. 기존 시스템 설정 데이터 삭제 (있다면)
DELETE FROM public.metadata WHERE key IN (
  'security_coin_new_user',
  'security_coin_referral',
  'dividend_coin_per_100',
  'dividend_coin_referral_percentage'
);

-- 2. 시스템 설정 초기값 추가
INSERT INTO public.metadata (key, value, updated_at) VALUES
  ('security_coin_new_user', 500, NOW()),
  ('security_coin_referral', 1000, NOW()),
  ('dividend_coin_per_100', 10000, NOW()),
  ('dividend_coin_referral_percentage', 10, NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

-- 3. 확인
SELECT * FROM public.metadata
WHERE key IN (
  'security_coin_new_user',
  'security_coin_referral',
  'dividend_coin_per_100',
  'dividend_coin_referral_percentage'
)
ORDER BY key;
