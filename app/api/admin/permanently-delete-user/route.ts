import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Permanently Delete User API Called ===')

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('Token exists:', !!token)

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = jwt.verify(token, JWT_SECRET) as any
    console.log('Token verified, isAdmin:', payload.isAdmin)

    if (!payload.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Request body:', body)

    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 })
    }

    console.log('Attempting to delete user:', userId)
    const success = await db.permanentlyDeleteUser(userId)
    console.log('Delete result:', success)

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
  } catch (error: any) {
    console.error('Permanently delete user error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다.',
      details: error?.message
    }, { status: 500 })
  }
}
