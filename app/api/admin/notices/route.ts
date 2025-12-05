import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { db } from '@/lib/db'
import { sendPushNotification } from '@/lib/push-notification'

// GET: 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '공지사항 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notices: data })
  } catch (error) {
    console.error('Get notices error:', error)
    return NextResponse.json(
      { error: '공지사항 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 공지사항 작성 (관리자 전용)
export async function POST(request: NextRequest) {
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

    const { type, title, content } = await request.json()

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 관리자 정보 가져오기
    const admin = await db.findUserById(payload.userId)

    if (!admin) {
      return NextResponse.json(
        { error: '관리자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 공지사항 생성
    const { data: notice, error: noticeError } = await supabaseAdmin
      .from('notices')
      .insert({
        type,
        title,
        content,
        author_id: admin.id,
        author_name: admin.name,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (noticeError) {
      console.error('Create notice error:', noticeError)
      return NextResponse.json(
        { error: '공지사항 작성 실패: ' + noticeError.message },
        { status: 500 }
      )
    }

    // 모든 사용자에게 알림 전송 (관리자 포함)
    try {
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id')

      if (allUsers && allUsers.length > 0) {
        // 모든 사용자에게 알림 생성 및 푸시 전송
        const notificationPromises = allUsers.map(async (user) => {
          // 인앱 알림 생성
          await db.createNotification(
            user.id,
            'SYSTEM',
            `📢 새 공지사항: ${title}`,
            content.length > 100 ? content.substring(0, 100) + '...' : content,
            admin.id
          )

          // 푸시 알림 전송
          await sendPushNotification(user.id, {
            title: `📢 새 공지사항: ${title}`,
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            data: {
              type: 'NOTICE',
              noticeId: notice.id
            }
          })
        })

        await Promise.all(notificationPromises)
      }
    } catch (notificationError) {
      console.error('Send notifications error:', notificationError)
      // 알림 전송 실패해도 공지사항 작성은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 작성되었고 모든 회원에게 알림이 전송되었습니다.',
      notice
    })
  } catch (error: any) {
    console.error('Create notice error:', error)
    return NextResponse.json(
      { error: '공지사항 작성 중 오류가 발생했습니다: ' + (error.message || error.toString()) },
      { status: 500 }
    )
  }
}

// DELETE: 공지사항 삭제 (관리자 전용)
export async function DELETE(request: NextRequest) {
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

    const { noticeId } = await request.json()

    if (!noticeId) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('notices')
      .delete()
      .eq('id', noticeId)

    if (error) {
      return NextResponse.json(
        { error: '공지사항 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Delete notice error:', error)
    return NextResponse.json(
      { error: '공지사항 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 공지사항 수정 (관리자 전용)
export async function PUT(request: NextRequest) {
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

    const { noticeId, type, title, content } = await request.json()

    if (!noticeId || !type || !title || !content) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({
        type,
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', noticeId)
      .select()
      .single()

    if (error) {
      console.error('Update notice error:', error)
      return NextResponse.json(
        { error: '공지사항 수정 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 수정되었습니다.',
      notice: data
    })
  } catch (error) {
    console.error('Update notice error:', error)
    return NextResponse.json(
      { error: '공지사항 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
