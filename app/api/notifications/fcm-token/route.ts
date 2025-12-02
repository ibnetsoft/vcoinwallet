import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { saveFCMToken } from '@/lib/fcm-push'

// POST: FCM 토큰 저장
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

    const { fcmToken } = await request.json()

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'FCM 토큰이 필요합니다.' },
        { status: 400 }
      )
    }

    const success = await saveFCMToken(payload.userId, fcmToken)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'FCM 토큰이 저장되었습니다.'
      })
    } else {
      return NextResponse.json(
        { error: 'FCM 토큰 저장 실패' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('FCM token save error:', error)
    return NextResponse.json(
      { error: 'FCM 토큰 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
