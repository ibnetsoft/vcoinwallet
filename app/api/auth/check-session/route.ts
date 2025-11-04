import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

// IP 주소 추출 함수
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { valid: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const user = await db.findUserById(decoded.userId)

    if (!user) {
      return NextResponse.json(
        { valid: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    // 관리자만 IP 체크
    if (user.isAdmin) {
      const currentIP = getClientIP(request)

      // 현재 IP와 마지막 로그인 IP가 다르면 세션 무효
      if (user.lastLoginIP && user.lastLoginIP !== currentIP && user.lastLoginIP !== 'unknown') {
        return NextResponse.json(
          { valid: false, error: '다른 기기에서 로그인되었습니다.' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { valid: false, error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
