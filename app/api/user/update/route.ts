import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
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
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, email, currentPassword, newPassword } = body

    // 현재 사용자 정보 가져오기
    const user = await db.findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비밀번호 변경을 시도하는 경우
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: '현재 비밀번호를 입력해주세요.' },
          { status: 400 }
        )
      }

      // 현재 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        )
      }

      // 새 비밀번호 유효성 검사
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: '새 비밀번호는 6자 이상이어야 합니다.' },
          { status: 400 }
        )
      }
    }

    // 전화번호 변경 시 중복 확인
    if (phone && phone !== user.phone) {
      const existingUser = await db.findUserByPhone(phone)
      if (existingUser) {
        return NextResponse.json(
          { error: '이미 사용 중인 전화번호입니다.' },
          { status: 400 }
        )
      }
    }

    // 사용자 정보 업데이트
    const updateData: any = {
      name: name || user.name,
      phone: phone || user.phone,
      email: email || user.email,
    }

    // 비밀번호 변경이 있는 경우
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedPassword
    }

    const updatedUser = await db.updateUser(decoded.userId, updateData)

    if (!updatedUser) {
      return NextResponse.json(
        { error: '사용자 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 비밀번호 제외하고 반환
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: '정보가 성공적으로 수정되었습니다.',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: '사용자 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
