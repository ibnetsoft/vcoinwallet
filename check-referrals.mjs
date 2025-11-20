import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userName = process.argv[2] || '박명희';

(async () => {
  // 회원 찾기
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, referral_code')
    .eq('name', userName)
    .single();

  if (userError || !user) {
    console.log(`${userName} 회원을 찾을 수 없습니다.`);
    return;
  }

  console.log(`=== ${userName} 회원 정보 ===`);
  console.log('아이디:', user.id);
  console.log('추천코드:', user.referral_code);
  console.log('');

  // 추천한 회원 목록 조회 (referred_by 컬럼 사용)
  const { data: referredUsers, error: refError } = await supabase
    .from('users')
    .select('id, name, phone, created_at, referred_by')
    .eq('referred_by', user.referral_code)
    .order('created_at', { ascending: false });

  if (refError) {
    console.log('조회 오류:', refError.message);
    return;
  }

  console.log('=== 추천한 회원 목록 ===');
  console.log('총 추천 인원:', referredUsers.length, '명');
  console.log('');

  if (referredUsers.length > 0) {
    referredUsers.forEach((ref, index) => {
      const date = new Date(ref.created_at).toLocaleString('ko-KR');
      console.log(`${index + 1}. ${ref.name} (${ref.phone}) - ${date}`);
    });
  } else {
    console.log('추천한 회원이 없습니다.');
  }
})();
