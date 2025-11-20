-- 팀장님 계정 로그인 문제 해결

-- 1. 팀장님 계정 확인
SELECT id, name, phone, role, is_admin, last_login_ip
FROM users
WHERE name = '팀장님';

-- 2. IP 로그인 제한 초기화 (로그인 가능하도록)
UPDATE users
SET last_login_ip = NULL,
    last_login_at = NULL
WHERE name = '팀장님';

-- 3. 팀장으로 설정 (아직 안 했다면)
UPDATE users
SET role = 'TEAM_LEADER',
    is_admin = false
WHERE name = '팀장님';

-- 4. 비밀번호 재설정이 필요한 경우 (임시 비밀번호: 123456)
-- 아래 주석을 해제하고 실행하면 비밀번호가 '123456'으로 변경됩니다
-- UPDATE users
-- SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxNzqQpla'
-- WHERE name = '팀장님';

-- 5. 결과 확인
SELECT id, name, phone, role, is_admin, last_login_ip, last_login_at
FROM users
WHERE name = '팀장님';
