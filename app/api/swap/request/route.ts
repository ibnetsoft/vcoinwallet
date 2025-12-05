import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST: 스왑 요청 생성
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

    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    const { amount } = await request.json()

    // 수량 검증
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '유효한 수량을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 정수 검증
    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: '정수만 입력 가능합니다.' },
        { status: 400 }
      )
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, member_number, dividend_coins')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 배당코인 잔액 확인
    if (user.dividend_coins < amount) {
      return NextResponse.json(
        { error: `배당코인이 부족합니다. (보유: ${user.dividend_coins}개)` },
        { status: 400 }
      )
    }

    // 대기중인 요청이 있는지 확인
    const { data: pendingRequests } = await supabaseAdmin
      .from('swap_requests')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('status', 'PENDING')

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json(
        { error: '이미 대기 중인 스왑 요청이 있습니다. 처리 후 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 스왑 요청 생성
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    const { data: swapRequest, error: insertError } = await supabaseAdmin
      .from('swap_requests')
      .insert({
        id: requestId,
        user_id: user.id,
        amount: amount,
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Swap request insert error:', insertError)
      return NextResponse.json(
        { error: '스왑 요청 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${amount}개의 배당코인 → 증권코인 스왑 요청이 접수되었습니다.`,
      request: swapRequest
    })

  } catch (error) {
    console.error('Swap request error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
