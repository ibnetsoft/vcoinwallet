import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: 자료실 목록 조회 (모든 사용자)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '자료실 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resources: data })
  } catch (error) {
    console.error('Get resources error:', error)
    return NextResponse.json(
      { error: '자료실 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 조회수 증가
export async function POST(request: NextRequest) {
  try {
    const { resourceId, type } = await request.json()

    if (!resourceId || !type) {
      return NextResponse.json(
        { error: 'resourceId와 type이 필요합니다.' },
        { status: 400 }
      )
    }

    if (type === 'view') {
      // 조회수 증가
      const { error } = await supabaseAdmin.rpc('increment_resource_view', {
        resource_id: resourceId
      })

      if (error) {
        console.error('Increment view error:', error)
        // 조회수 증가 실패는 에러로 처리하지 않음
      }
    } else if (type === 'download') {
      // 다운로드수 증가
      const { error } = await supabaseAdmin.rpc('increment_resource_download', {
        resource_id: resourceId
      })

      if (error) {
        console.error('Increment download error:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Increment count error:', error)
    return NextResponse.json(
      { error: '카운트 증가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
