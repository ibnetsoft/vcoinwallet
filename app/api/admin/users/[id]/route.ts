import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { phone, idNumber } = body

    // 회원 정보 업데이트
    const success = await db.updateUserInfo(params.id, { phone, idNumber })

    if (!success) {
      return NextResponse.json(
        { error: '회원 정보 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: '회원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
