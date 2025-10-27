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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    const success = await db.deleteUser(userId)

    if (!success) {
      return NextResponse.json({ error: '회원 탈퇴 처리에 실패했습니다.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴 처리가 완료되었습니다.'
    })
  } catch (error) {
    console.error('회원 탈퇴 처리 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
