import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { db } from '@/lib/db'

// GET: 자료실 목록 조회
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

// POST: 자료실 게시글 작성 (관리자 전용)
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

    const { type, title, content, fileUrl, fileName, fileSize, fileType } = await request.json()

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

    // 게시글 생성
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .insert({
        type,
        title,
        content,
        author_id: admin.id,
        author_name: admin.name,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        file_type: fileType || null,
        view_count: 0,
        download_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (resourceError) {
      console.error('Create resource error:', resourceError)
      return NextResponse.json(
        { error: '게시글 작성 실패: ' + resourceError.message },
        { status: 500 }
      )
    }

    // 백그라운드에서 알림 전송 (응답 먼저 반환)
    const resourceTitle = title
    const resourceContent = content
    const resourceId = resource.id
    const adminId = admin.id

    // 비동기로 처리 (await 없이)
    ;(async () => {
      try {
        const { data: allUsers } = await supabaseAdmin
          .from('users')
          .select('id')

        if (allUsers && allUsers.length > 0) {
          for (const user of allUsers) {
            try {
              await db.createNotification(
                user.id,
                'SYSTEM',
                `📎 새 자료: ${resourceTitle}`,
                resourceContent.length > 100 ? resourceContent.substring(0, 100) + '...' : resourceContent,
                adminId
              )
            } catch (e) {
              console.error(`Notification creation failed for user ${user.id}:`, e)
            }
          }
        }

        const { data: allTokens } = await supabaseAdmin
          .from('fcm_tokens')
          .select('token')

        if (allTokens && allTokens.length > 0) {
          const { sendFCMMessageREST } = await import('@/lib/fcm-rest')

          for (const tokenData of allTokens) {
            try {
              await sendFCMMessageREST({
                token: tokenData.token,
                notification: {
                  title: `📎 새 자료: ${resourceTitle}`,
                  body: resourceContent.length > 100 ? resourceContent.substring(0, 100) + '...' : resourceContent
                },
                data: {
                  type: 'RESOURCE',
                  resourceId: String(resourceId)
                }
              })
            } catch (e) {
              console.error(`FCM send failed:`, e)
            }
          }
        }
      } catch (error) {
        console.error('Background notification error:', error)
      }
    })()

    return NextResponse.json({
      success: true,
      message: '게시글이 작성되었고 모든 회원에게 알림이 전송되었습니다.',
      resource
    })
  } catch (error: any) {
    console.error('Create resource error:', error)
    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다: ' + (error.message || error.toString()) },
      { status: 500 }
    )
  }
}

// DELETE: 게시글 삭제 (관리자 전용)
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

    const { resourceId } = await request.json()

    if (!resourceId) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 게시글 정보 가져오기 (파일 삭제를 위해)
    const { data: resource } = await supabaseAdmin
      .from('resources')
      .select('file_url')
      .eq('id', resourceId)
      .single()

    // 파일이 있으면 Storage에서도 삭제
    if (resource && resource.file_url) {
      try {
        const fileName = resource.file_url.split('/').pop()
        if (fileName) {
          await supabaseAdmin.storage
            .from('resources')
            .remove([fileName])
        }
      } catch (storageError) {
        console.error('File delete error:', storageError)
        // 파일 삭제 실패해도 계속 진행
      }
    }

    // 게시글 삭제
    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', resourceId)

    if (error) {
      return NextResponse.json(
        { error: '게시글 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    })
  } catch (error) {
    console.error('Delete resource error:', error)
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 게시글 수정 (관리자 전용)
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

    const { resourceId, type, title, content, fileUrl, fileName, fileSize, fileType } = await request.json()

    if (!resourceId || !type || !title || !content) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('resources')
      .update({
        type,
        title,
        content,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        file_type: fileType || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .select()
      .single()

    if (error) {
      console.error('Update resource error:', error)
      return NextResponse.json(
        { error: '게시글 수정 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '게시글이 수정되었습니다.',
      resource: data
    })
  } catch (error) {
    console.error('Update resource error:', error)
    return NextResponse.json(
      { error: '게시글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
