-- 회원을 수동으로 삭제하는 SQL 스크립트
-- Supabase SQL Editor에서 실행

-- 1. 먼저 삭제할 회원 정보 확인
SELECT id, name, phone, member_number, referral_code
FROM users
WHERE member_number = 59;  -- 삭제할 회원번호로 변경

-- 2. 해당 회원의 ID를 복사한 후 아래 스크립트 실행
-- 'USER_ID_HERE'를 위에서 복사한 ID로 교체하세요

-- 알림 삭제 (user_id)
DELETE FROM notifications WHERE user_id = 'USER_ID_HERE';

-- 알림 삭제 (related_user_id)
DELETE FROM notifications WHERE related_user_id = 'USER_ID_HERE';

-- 푸시 구독 삭제
DELETE FROM push_subscriptions WHERE user_id = 'USER_ID_HERE';

-- 거래 내역 삭제
DELETE FROM transactions WHERE user_id = 'USER_ID_HERE';

-- 이 회원을 추천인으로 가진 다른 회원들의 referred_by를 null로 설정
UPDATE users
SET referred_by = NULL
WHERE referred_by = (SELECT referral_code FROM users WHERE id = 'USER_ID_HERE');

-- 사용자 삭제
DELETE FROM users WHERE id = 'USER_ID_HERE';

-- 결과 확인
SELECT COUNT(*) as "남은 회원 수" FROM users WHERE id != 'USER_ID_HERE';
