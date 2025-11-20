-- 모든 알림 삭제

-- 1. 삭제 전 현재 알림 개수 확인
SELECT COUNT(*) as total_notifications
FROM notifications;

-- 2. 알림 타입별 개수 확인
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type;

-- 3. 모든 알림 삭제
DELETE FROM notifications;

-- 4. 삭제 후 확인 (0개여야 함)
SELECT COUNT(*) as remaining_notifications
FROM notifications;
