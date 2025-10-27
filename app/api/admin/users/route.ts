import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // 토큰 검증 (실제로는 verifyToken 함수 구현 필요)
    // const decoded = verifyToken(token)
    // if (!decoded || !decoded.isAdmin) {
    //   return NextResponse.json(
    //     { error: '관리자 권한이 필요합니다.' },
    //     { status: 403 }
    //   )
    // }

    // 모든 사용자 가져오기
    const users = await db.getAllUsers()

    // 비밀번호 제거
    const usersWithoutPassword = users.map(({ password, ...user }) => ({
      ...user,
      createdAt: new Date(user.createdAt).toISOString().split('T')[0] // 날짜 포맷
    }))

    return NextResponse.json({
      users: usersWithoutPassword,
      total: usersWithoutPassword.length
    })

  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
