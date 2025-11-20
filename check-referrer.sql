-- Check user and referrer info
SELECT
  u.id,
  u.name,
  u.phone,
  u.member_number,
  u.referred_by,
  r.name as referrer_name,
  r.phone as referrer_phone,
  r.member_number as referrer_member_number
FROM users u
LEFT JOIN users r ON u.referred_by = r.id
WHERE u.phone = '01044818013';
