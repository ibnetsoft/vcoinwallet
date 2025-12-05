import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendFCMNotification } from '@/lib/fcm-push'
import { db } from '@/lib/db'

// POST: 스왑 요청 승인
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

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: '요청 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 스왑 요청 조회
    const { data: swapRequest, error: requestError } = await supabaseAdmin
      .from('swap_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !swapRequest) {
      return NextResponse.json(
        { error: '스왑 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (swapRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 처리된 요청입니다.' },
        { status: 400 }
      )
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', swapRequest.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 배당코인 잔액 확인
    if (user.dividend_coins < swapRequest.amount) {
      return NextResponse.json(
        { error: `사용자의 배당코인이 부족합니다. (보유: ${user.dividend_coins}개, 요청: ${swapRequest.amount}개)` },
        { status: 400 }
      )
    }

    // 스왑 처리 (1:1 비율)
    const newDividendCoins = user.dividend_coins - swapRequest.amount
    const newSecurityCoins = user.security_coins + swapRequest.amount

    // 사용자 코인 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        dividend_coins: newDividendCoins,
        security_coins: newSecurityCoins
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json(
        { error: '코인 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 거래 기록 생성 (배당코인 차감)
    const txId1 = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    await supabaseAdmin.from('transactions').insert({
      id: txId1,
      user_id: user.id,
      type: 'SWAP_OUT',
      coin_type: 'DIVIDEND',
      amount: -swapRequest.amount,
      balance: newDividendCoins,
      description: `스왑 출금 - 배당코인 ${swapRequest.amount}개 → 증권코인`,
      created_at: new Date().toISOString()
    })

    // 거래 기록 생성 (증권코인 증가)
    const txId2 = Date.now().toString() + Math.random().toString(36).substr(2, 9) + '2'
    await supabaseAdmin.from('transactions').insert({
      id: txId2,
      user_id: user.id,
      type: 'SWAP_IN',
      coin_type: 'SECURITY',
      amount: swapRequest.amount,
      balance: newSecurityCoins,
      description: `스왑 입금 - 배당코인에서 증권코인 ${swapRequest.amount}개`,
      created_at: new Date().toISOString()
    })

    // 스왑 요청 상태 업데이트
    await supabaseAdmin
      .from('swap_requests')
      .update({
        status: 'APPROVED',
        processed_at: new Date().toISOString(),
        processed_by: payload.userId
      })
      .eq('id', requestId)

    // 인앱 알림 생성
    try {
      await db.createNotification(
        user.id,
        'SYSTEM',
        '✅ 스왑 요청 승인',
        `배당코인 ${swapRequest.amount}개가 증권코인으로 전환되었습니다.`,
        payload.userId
      )
    } catch (e) {
      console.error('Notification error:', e)
    }

    // FCM 푸시 알림
    try {
      await sendFCMNotification(user.id, {
        title: '✅ 스왑 요청 승인',
        body: `배당코인 ${swapRequest.amount}개가 증권코인으로 전환되었습니다.`,
        data: { type: 'SWAP_APPROVED' }
      })
    } catch (e) {
      console.error('FCM error:', e)
    }

    return NextResponse.json({
      success: true,
      message: `${user.name}님의 스왑 요청이 승인되었습니다. (${swapRequest.amount}개)`
    })

  } catch (error) {
    console.error('Swap approve error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
