import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 인증 토큰 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload || !payload.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, amount, description } = body

    // 사용자 확인
    const user = await db.findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 배당코인 수정 (추천인 보너스 없음)
    const success = await db.setDividendCoins(
      userId,
      amount,
      description || `배당코인 수정 - ${amount}개로 변경`
    )

    if (!success) {
      return NextResponse.json(
        { error: '배당코인 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 업데이트된 사용자 정보 가져오기
    const updatedUser = await db.findUserById(userId)

    return NextResponse.json({
      success: true,
      message: `배당코인이 ${amount}개로 수정되었습니다.`,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        dividendCoins: updatedUser?.dividendCoins
      }
    })

  } catch (error) {
    console.error('Set dividend coins error:', error)
    return NextResponse.json(
      { error: '배당코인 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
