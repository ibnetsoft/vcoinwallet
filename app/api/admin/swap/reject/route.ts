import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendFCMNotification } from '@/lib/fcm-push'
import { db } from '@/lib/db'

// POST: 스왑 요청 거절
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

    const { requestId, reason } = await request.json()

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
      .select('id, name')
      .eq('id', swapRequest.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 스왑 요청 상태 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('swap_requests')
      .update({
        status: 'REJECTED',
        processed_at: new Date().toISOString(),
        processed_by: payload.userId
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: '요청 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 인앱 알림 생성
    const rejectMessage = reason
      ? `배당코인 ${swapRequest.amount}개 스왑 요청이 거절되었습니다.\n사유: ${reason}`
      : `배당코인 ${swapRequest.amount}개 스왑 요청이 거절되었습니다.`

    try {
      await db.createNotification(
        user.id,
        'SYSTEM',
        '❌ 스왑 요청 거절',
        rejectMessage,
        payload.userId
      )
    } catch (e) {
      console.error('Notification error:', e)
    }

    // FCM 푸시 알림
    try {
      await sendFCMNotification(user.id, {
        title: '❌ 스왑 요청 거절',
        body: rejectMessage,
        data: { type: 'SWAP_REJECTED' }
      })
    } catch (e) {
      console.error('FCM error:', e)
    }

    return NextResponse.json({
      success: true,
      message: `${user.name}님의 스왑 요청이 거절되었습니다.`
    })

  } catch (error) {
    console.error('Swap reject error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
