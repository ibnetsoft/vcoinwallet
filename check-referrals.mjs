import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const action = process.argv[2] || 'check';

(async () => {
  if (action === 'fix') {
    // 마이그레이션 실행: referralCode → user.id
    console.log('=== referred_by 마이그레이션 (referralCode → user.id) ===\n');

    // 모든 사용자 가져오기 (페이지네이션으로 전체 조회)
    let allUsers = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await supabase
        .from('users')
        .select('id, name, referral_code, referred_by, member_number')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!data || data.length === 0) break;
      allUsers = [...allUsers, ...data];
      if (data.length < pageSize) break;
      page++;
    }
    console.log('전체 사용자 수:', allUsers.length);

    if (!allUsers) {
      console.log('사용자 목록 조회 실패');
      return;
    }

    // referralCode → user.id 매핑 생성
    const codeToIdMap = new Map();
    allUsers.forEach(u => codeToIdMap.set(u.referral_code, u.id));

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      if (!user.referred_by) {
        skippedCount++;
        continue;
      }

      // 이미 숫자(user.id)이면 스킵
      if (/^\d+$/.test(user.referred_by)) {
        skippedCount++;
        continue;
      }

      // referralCode를 user.id로 변환
      const referrerId = codeToIdMap.get(user.referred_by);

      if (!referrerId) {
        console.log(`⚠️ ${user.name}: 추천코드 ${user.referred_by}에 해당하는 사용자 없음`);
        continue;
      }

      const { error } = await supabase
        .from('users')
        .update({ referred_by: referrerId })
        .eq('id', user.id);

      if (error) {
        console.log(`❌ ${user.name}: 업데이트 실패 - ${error.message}`);
      } else {
        console.log(`✅ ${user.name} (회원번호 ${user.member_number}): ${user.referred_by} → ${referrerId}`);
        updatedCount++;
      }
    }

    console.log(`\n=== 완료 ===`);
    console.log(`수정됨: ${updatedCount}명`);
    console.log(`스킵됨: ${skippedCount}명`);

  } else {
    // 진단 모드
    console.log('=== referred_by 데이터 진단 ===\n');

    // 모든 사용자 가져오기 (페이지네이션으로 전체 조회)
    let allUsers = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data } = await supabase
        .from('users')
        .select('id, name, referral_code, referred_by, member_number')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!data || data.length === 0) break;
      allUsers = [...allUsers, ...data];
      if (data.length < pageSize) break;
      page++;
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('사용자 목록 조회 실패');
      return;
    }

    let codeFormat = 0;
    let idFormat = 0;
    let nullFormat = 0;

    const codeFormatUsers = [];

    allUsers.forEach(u => {
      if (!u.referred_by) {
        nullFormat++;
      } else if (/^\d+$/.test(u.referred_by)) {
        idFormat++;
      } else {
        codeFormat++;
        codeFormatUsers.push(u);
      }
    });

    console.log(`전체 사용자: ${allUsers.length}명`);
    console.log(`referred_by = NULL: ${nullFormat}명`);
    console.log(`referred_by = user.id (정상): ${idFormat}명`);
    console.log(`referred_by = referralCode (수정필요): ${codeFormat}명\n`);

    if (codeFormatUsers.length > 0) {
      console.log('=== 수정이 필요한 회원 목록 ===');
      codeFormatUsers.forEach(u => {
        console.log(`  - ${u.name} (회원번호 ${u.member_number}): referred_by = ${u.referred_by}`);
      });
      console.log(`\n마이그레이션 실행: node check-referrals.mjs fix`);
    }
  }
})();
