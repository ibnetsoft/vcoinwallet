import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

/**
 * referred_by 필드를 user ID에서 referralCode로 수정하는 API
 *
 * 문제: referred_by에 user ID가 저장되어 있음 (예: '1761536398367')
 * 해결: referred_by를 해당 사용자의 referralCode로 변경 (예: 'DZ6H6S')
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    console.log('=== referred_by 필드 수정 시작 ===')

    // 모든 사용자 가져오기
    const { data: allUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')

    if (fetchError || !allUsers) {
      console.error('사용자 목록 조회 실패:', fetchError)
      return NextResponse.json(
        { error: '사용자 목록 조회 실패', details: fetchError },
        { status: 500 }
      )
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
    const updates: string[] = []

    // referred_by가 user ID인 사용자들 수정
    for (const user of allUsers) {
      if (!user.referred_by) {
        skippedCount++
        continue
      }

      const currentReferredBy = user.referred_by

      // 이미 referralCode 형식이면 스킵 (짧고 숫자만이 아닌 경우)
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
        const updateMsg = `✓ ${user.name}: ${currentReferredBy} → ${referralCode}`
        console.log(`  ${updateMsg}`)
        updates.push(updateMsg)
        updatedCount++
      }
    }

    const result = {
      success: true,
      totalUsers: allUsers.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      updates
    }

    console.log('\n=== 수정 완료 ===')
    console.log(`총 사용자: ${allUsers.length}`)
    console.log(`수정됨: ${updatedCount}`)
    console.log(`스킵됨: ${skippedCount}`)
    console.log(`에러: ${errorCount}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Fix referrals error:', error)
    return NextResponse.json(
      { error: 'referred_by 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
