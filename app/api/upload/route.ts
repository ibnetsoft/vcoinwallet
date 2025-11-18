import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
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

    // 시스템 설정에서 파일 크기 제한 가져오기
    const config = await db.getSystemConfig()
    const maxFileSize = config.boardMaxFileSize || 10485760 // 기본 10MB

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 확인
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
      return NextResponse.json(
        { error: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.` },
        { status: 400 }
      )
    }

    // 파일 이름 생성 (중복 방지를 위해 타임스탬프 추가)
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}_${sanitizedFileName}`

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Supabase Storage에 업로드
    const { data, error } = await supabaseAdmin.storage
      .from('resources')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('File upload error:', error)
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다: ' + error.message },
        { status: 500 }
      )
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabaseAdmin.storage
      .from('resources')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      file: {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다: ' + (error.message || error.toString()) },
      { status: 500 }
    )
  }
}
