import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET: 관리자 - 전체 스왑 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
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

    // URL 파라미터로 필터링
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, APPROVED, REJECTED, 또는 null(전체)

    // 스왑 요청 목록 조회
    let query = supabaseAdmin
      .from('swap_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Get swap requests error:', error)
      return NextResponse.json(
        { error: '스왑 요청 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 사용자 정보 조회
    const userIds = [...new Set(requests?.map(r => r.user_id) || [])]

    let usersMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, member_number, phone, dividend_coins, security_coins')
        .in('id', userIds)

      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<string, any>)
      }
    }

    // 요청에 사용자 정보 추가
    const requestsWithUsers = requests?.map(req => ({
      ...req,
      user: usersMap[req.user_id] || null
    })) || []

    return NextResponse.json({
      success: true,
      requests: requestsWithUsers
    })

  } catch (error) {
    console.error('Get swap requests error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
