-- 테스트 회원을 관리자로 승격

-- '테스트' 이름의 회원을 관리자로 변경
UPDATE users
SET role = 'ADMIN',
    is_admin = true
WHERE name = '테스트';

-- 결과 확인
SELECT id, name, phone, member_number, role, is_admin
FROM users
WHERE name = '테스트';

-- 전체 관리자 목록 확인
SELECT id, name, phone, member_number, role, is_admin
FROM users
WHERE is_admin = true
ORDER BY member_number;
