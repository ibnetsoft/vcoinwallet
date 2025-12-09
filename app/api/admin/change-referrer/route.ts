import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST: 회원의 추천인 변경
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload || !payload.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { userId, newReferrerId, grantBonus } = await request.json()

    console.log('Change referrer request:', { userId, newReferrerId, grantBonus })

    if (!userId) {
      return NextResponse.json(
        { error: '회원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 대상 회원 조회
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, referred_by')
      .eq('id', userId)
      .single()

    console.log('Target user query result:', { targetUser, targetError })

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자기 자신을 추천인으로 설정 불가
    if (userId === newReferrerId) {
      return NextResponse.json(
        { error: '자기 자신을 추천인으로 설정할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 새 추천인이 지정된 경우 유효성 확인
    let newReferrer = null
    if (newReferrerId) {
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('users')
        .select('id, name, phone, security_coins')
        .eq('id', newReferrerId)
        .single()

      if (referrerError || !referrer) {
        return NextResponse.json(
          { error: '새 추천인을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 순환 참조 체크 (새 추천인의 추천 체인에 대상 회원이 있는지)
      let currentId = newReferrerId
      const visited = new Set<string>()
      while (currentId) {
        if (currentId === userId) {
          return NextResponse.json(
            { error: '순환 참조가 발생합니다. 해당 회원은 새 추천인의 상위 추천 체인에 있습니다.' },
            { status: 400 }
          )
        }
        if (visited.has(currentId)) break
        visited.add(currentId)

        const { data: checkUser } = await supabaseAdmin
          .from('users')
          .select('referred_by')
          .eq('id', currentId)
          .single()

        currentId = checkUser?.referred_by
      }

      newReferrer = referrer
    }

    // 이전 추천인 정보
    const oldReferrerId = targetUser.referred_by

    // 추천인 변경
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ referred_by: newReferrerId || null })
      .eq('id', userId)

    if (updateError) {
      console.error('Update referrer error:', updateError)
      return NextResponse.json(
        { error: '추천인 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 새 추천인에게 보너스 지급 (옵션)
    let bonusGranted = false
    let bonusAmount = 0

    if (grantBonus && newReferrer) {
      // 시스템 설정에서 추천 보너스 금액 가져오기
      const { data: settings } = await supabaseAdmin
        .from('system_config')
        .select('value')
        .eq('key', 'referralBonus')
        .single()

      bonusAmount = settings?.value ? parseInt(settings.value) : 1000

      // 새 추천인에게 증권코인 지급
      const { error: bonusError } = await supabaseAdmin
        .from('users')
        .update({ security_coins: (newReferrer.security_coins || 0) + bonusAmount })
        .eq('id', newReferrerId)

      if (!bonusError) {
        bonusGranted = true

        // 거래 기록 생성
        await supabaseAdmin.from('transactions').insert({
          id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
          user_id: newReferrerId,
          type: 'REFERRAL_BONUS',
          coin_type: 'SECURITY',
          amount: bonusAmount,
          balance: (newReferrer.security_coins || 0) + bonusAmount,
          description: `추천인 변경 보너스 (${targetUser.name}님 추천)`,
          created_at: new Date().toISOString()
        })
      }
    }

    // 이전 추천인 이름 조회
    let oldReferrerName = null
    if (oldReferrerId) {
      const { data: oldReferrer } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', oldReferrerId)
        .single()
      oldReferrerName = oldReferrer?.name
    }

    return NextResponse.json({
      success: true,
      message: newReferrer
        ? `${targetUser.name}님의 추천인이 ${newReferrer.name}님으로 변경되었습니다.${bonusGranted ? ` (보너스 ${bonusAmount.toLocaleString()}코인 지급)` : ''}`
        : `${targetUser.name}님의 추천인이 삭제되었습니다.`,
      data: {
        userId,
        userName: targetUser.name,
        oldReferrerId,
        oldReferrerName,
        newReferrerId: newReferrerId || null,
        newReferrerName: newReferrer?.name || null,
        bonusGranted,
        bonusAmount: bonusGranted ? bonusAmount : 0
      }
    })

  } catch (error) {
    console.error('Change referrer error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
