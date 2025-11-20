-- 최근 알림 확인
SELECT id, user_id, type, title, message, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 팀장님에게 온 알림 확인
SELECT id, user_id, type, title, message, created_at
FROM notifications
WHERE user_id = '1762146368693'
ORDER BY created_at DESC;

-- 모든 사용자 확인 (추천 관계 파악)
SELECT id, name, phone, member_number, referral_code, referred_by
FROM users
ORDER BY member_number;
