-- 휴대폰 번호로 회원 정보 조회

SELECT id, name, phone, password, member_number, role, created_at
FROM users
WHERE phone = '01036192850';
