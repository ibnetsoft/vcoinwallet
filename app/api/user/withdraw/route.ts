import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // 토큰 검증
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
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

    const userId = decoded.userId

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 어드민은 탈퇴 불가
    if (user.role === 'ADMIN' || user.role === 'admin') {
      return NextResponse.json(
        { error: '관리자 계정은 탈퇴할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 사용자 비활성화 (완전 삭제 대신 비활성화 처리)
    const withdrawnEmail = `withdrawn_${userId}_${Date.now()}@deleted.com`
    const withdrawnPhone = `withdrawn_${Date.now()}`

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email: withdrawnEmail,
        phone: withdrawnPhone,
        name: '탈퇴한 회원',
        password: 'WITHDRAWN_ACCOUNT',
        security_coins: 0,
        dividend_coins: 0,
        id_number: null,
        is_active: false
      })
      .eq('id', userId)

    if (updateError) {
      console.error('회원 탈퇴 오류:', updateError)
      return NextResponse.json(
        { error: '회원 탈퇴 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.'
    })

  } catch (error) {
    console.error('회원 탈퇴 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
