import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - 모든 공지사항 조회 (인증 불필요 - 누구나 접근 가능)
export async function GET(request: NextRequest) {
  try {
    // 공지사항 조회 (최신순)
    const { data: notices, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('공지사항 조회 오류:', error)
      return NextResponse.json({ error: '공지사항 조회에 실패했습니다.' }, { status: 500 })
    }

    // PWA 캐시 방지 헤더 추가
    return NextResponse.json(
      { notices: notices || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('공지사항 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
