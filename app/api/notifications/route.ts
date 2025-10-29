import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET: 사용자의 알림 목록 조회
export async function GET(request: NextRequest) {
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

    const notifications = await db.getNotifications(userId)
    const unreadCount = await db.getUnreadNotificationCount(userId)

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: '알림 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH: 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    jwt.verify(token, JWT_SECRET)
    const { notificationId, markAllAsRead } = await request.json()

    let success = false
    const payload = jwt.verify(token, JWT_SECRET) as any

    if (markAllAsRead) {
      success = await db.markAllNotificationsAsRead(payload.userId)
    } else if (notificationId) {
      success = await db.markNotificationAsRead(notificationId)
    }

    if (!success) {
      return NextResponse.json(
        { error: '알림 읽음 처리에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
