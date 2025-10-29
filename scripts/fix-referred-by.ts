/**
 * referred_by 필드를 user ID에서 referralCode로 수정하는 마이그레이션 스크립트
 *
 * 문제: referred_by에 user ID가 저장되어 있음 (예: '1761536398367')
 * 해결: referred_by를 해당 사용자의 referralCode로 변경 (예: 'DZ6H6S')
 */

import dotenv from 'dotenv'
import path from 'path'

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { supabaseAdmin } from '../lib/supabase'

async function fixReferredBy() {
  console.log('=== referred_by 필드 수정 시작 ===')

  // 모든 사용자 가져오기
  const { data: allUsers, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')

  if (fetchError || !allUsers) {
    console.error('사용자 목록 조회 실패:', fetchError)
    return
  }

  console.log(`전체 사용자 수: ${allUsers.length}`)

  // ID -> referralCode 매핑 생성
  const idToReferralCodeMap = new Map<string, string>()
  for (const user of allUsers) {
    idToReferralCodeMap.set(user.id, user.referral_code)
  }

  let updatedCount = 0
  let skippedCount = 0
  let errorCount = 0

  // referred_by가 user ID인 사용자들 수정
  for (const user of allUsers) {
    if (!user.referred_by) {
      skippedCount++
      continue
    }

    // referred_by가 ID처럼 보이는지 확인 (숫자만 있거나 ADMIN1 같은 경우)
    const currentReferredBy = user.referred_by

    // 이미 referralCode 형식이면 스킵
    if (currentReferredBy.length <= 10 && !/^\d+$/.test(currentReferredBy)) {
      console.log(`  ${user.name}: 이미 referralCode 형식 (${currentReferredBy}), 스킵`)
      skippedCount++
      continue
    }

    // ID를 referralCode로 변환
    const referralCode = idToReferralCodeMap.get(currentReferredBy)

    if (!referralCode) {
      console.warn(`  ${user.name}: referred_by ID(${currentReferredBy})에 해당하는 사용자를 찾을 수 없음`)
      errorCount++
      continue
    }

    // 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ referred_by: referralCode })
      .eq('id', user.id)

    if (updateError) {
      console.error(`  ${user.name}: 업데이트 실패 -`, updateError.message)
      errorCount++
    } else {
      console.log(`  ✓ ${user.name}: ${currentReferredBy} → ${referralCode}`)
      updatedCount++
    }
  }

  console.log('\n=== 수정 완료 ===')
  console.log(`총 사용자: ${allUsers.length}`)
  console.log(`수정됨: ${updatedCount}`)
  console.log(`스킵됨: ${skippedCount}`)
  console.log(`에러: ${errorCount}`)
}

// 스크립트 실행
fixReferredBy()
  .then(() => {
    console.log('\n스크립트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n스크립트 실행 중 오류:', error)
    process.exit(1)
  })
