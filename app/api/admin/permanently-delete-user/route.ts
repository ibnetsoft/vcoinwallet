import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = jwt.verify(token, JWT_SECRET) as any

    if (!payload.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    const success = await db.permanentlyDeleteUser(userId)

    if (!success) {
      return NextResponse.json(
        { error: '회원 영구 삭제에 실패했습니다. 관리자는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '회원이 데이터베이스에서 완전히 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Permanently delete user error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
