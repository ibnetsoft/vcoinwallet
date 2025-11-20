-- 회원번호를 1번부터 다시 시작하도록 리셋하는 스크립트

-- 1단계: 59번 회원을 1번으로 변경
UPDATE users
SET member_number = 1
WHERE member_number = 59;

-- 2단계: metadata 테이블의 next_member_number를 2로 업데이트 (다음 가입자는 2번)
UPDATE metadata
SET value = 2,
    updated_at = NOW()
WHERE key = 'next_member_number';

-- 만약 next_member_number 레코드가 없다면 새로 생성
INSERT INTO metadata (key, value, updated_at)
SELECT 'next_member_number', 2, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM metadata WHERE key = 'next_member_number'
);

-- 결과 확인
SELECT
    '회원 정보' as 구분,
    id,
    name,
    member_number as 회원번호
FROM users
WHERE member_number = 1

UNION ALL

SELECT
    'Next Member Number' as 구분,
    key as id,
    CAST(value AS TEXT) as name,
    value as 회원번호
FROM metadata
WHERE key = 'next_member_number';
