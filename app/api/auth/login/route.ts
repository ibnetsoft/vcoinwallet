import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    // 사용자 조회
    const user = db.findUserByPhone(phone)

    if (!user) {
      return NextResponse.json(
        { error: '휴대폰 번호 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인 (평문 비교)
    if (password !== user.password) {
      return NextResponse.json(
        { error: '휴대폰 번호 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 계정 상태 확인
    if (user.status === 'BLOCKED') {
      return NextResponse.json(
        { error: '차단된 계정입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    if (user.status === 'DELETED') {
      return NextResponse.json(
        { error: '탈퇴 처리된 계정입니다.' },
        { status: 403 }
      )
    }

    // JWT 토큰 생성
    const token = createToken({
      userId: user.id,
      phone: user.phone,
      isAdmin: user.isAdmin
    })

    // 사용자 정보 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: '로그인 성공!'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
