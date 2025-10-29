import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST: 푸시 알림 구독 저장
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = jwt.verify(token, JWT_SECRET) as any
    const userId = payload.userId
    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: '유효하지 않은 구독 정보입니다.' },
        { status: 400 }
      )
    }

    const success = await db.savePushSubscription(userId, subscription)

    if (!success) {
      return NextResponse.json(
        { error: '푸시 알림 구독 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save push subscription error:', error)
    return NextResponse.json(
      { error: '푸시 알림 구독 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}
