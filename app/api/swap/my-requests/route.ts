import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET: 내 스왑 요청 목록 조회
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

    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 내 스왑 요청 목록 조회
    const { data: requests, error } = await supabaseAdmin
      .from('swap_requests')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get my swap requests error:', error)
      return NextResponse.json(
        { error: '스왑 요청 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    })

  } catch (error) {
    console.error('Get my swap requests error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
