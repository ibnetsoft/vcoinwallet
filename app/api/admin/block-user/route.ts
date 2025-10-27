import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    // 토큰 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = jwt.verify(token, JWT_SECRET) as any

    // 관리자 권한 확인
    if (!payload.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    let success = false
    let message = ''

    if (action === 'block') {
      success = db.blockUser(userId)
      message = success ? '회원이 차단되었습니다.' : '회원 차단에 실패했습니다.'
    } else if (action === 'unblock') {
      success = db.unblockUser(userId)
      message = success ? '회원 차단이 해제되었습니다.' : '차단 해제에 실패했습니다.'
    } else {
      return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('회원 차단 처리 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
