import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, password, referralCode } = body

    // 필수 필드 검증
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: '이름, 휴대폰 번호, 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 길이 확인 (6자 이상)
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 휴대폰 번호 중복 확인
    const existingUser = db.findUserByPhone(phone)

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 휴대폰 번호입니다.' },
        { status: 400 }
      )
    }

    // 추천인 확인
    if (referralCode) {
      const referrer = db.findUserByReferralCode(referralCode)
      if (!referrer) {
        return NextResponse.json(
          { error: '유효하지 않은 추천 코드입니다.' },
          { status: 400 }
        )
      }
    }

    // 사용자 생성
    const user = await db.createUser({
      name,
      phone,
      email: email || undefined,
      password,
      referralCode
    })

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
      message: '회원가입이 완료되었습니다!'
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
