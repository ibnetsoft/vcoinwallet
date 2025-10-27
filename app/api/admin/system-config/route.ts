import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// GET: 시스템 설정 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = jwt.verify(token, JWT_SECRET) as any

    if (!payload.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const config = await db.getSystemConfig()

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Get system config error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 시스템 설정 저장
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = jwt.verify(token, JWT_SECRET) as any

    if (!payload.isAdmin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { config } = await request.json()

    const success = await db.saveSystemConfig(config)

    if (!success) {
      return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '시스템 설정이 저장되었습니다.',
      config
    })
  } catch (error) {
    console.error('Save system config error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
