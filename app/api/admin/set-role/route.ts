import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Set Role API Called ===')

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    console.log('Auth header exists:', !!authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('Token extracted, length:', token.length)

    const decoded = verifyToken(token)
    console.log('Token decoded:', decoded)

    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const adminUser = await db.findUserById(decoded.userId)
    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: '사용자 ID와 등급이 필요합니다.' },
        { status: 400 }
      )
    }

    // role 유효성 검사
    if (!['ADMIN', 'TEAM_LEADER', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 등급입니다.' },
        { status: 400 }
      )
    }

    const targetUser = await db.findUserById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자기 자신의 등급은 변경할 수 없음
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: '자신의 등급은 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 사용자 등급 업데이트
    const updatedUser = await db.updateUser(userId, {
      role: role as 'ADMIN' | 'TEAM_LEADER' | 'USER',
      isAdmin: role === 'ADMIN'  // 하위 호환성
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: '등급 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    const roleNames: Record<string, string> = {
      'ADMIN': '관리자',
      'TEAM_LEADER': '팀장',
      'USER': '일반회원'
    }

    return NextResponse.json({
      message: `${targetUser.name}님의 등급이 ${roleNames[role as string]}(으)로 변경되었습니다.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    })

  } catch (error: any) {
    console.error('Set role error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: '등급 변경 중 오류가 발생했습니다.', details: error?.message },
      { status: 500 }
    )
  }
}
