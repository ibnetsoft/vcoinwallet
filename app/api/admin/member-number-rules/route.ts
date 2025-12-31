import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const rules = await db.getMemberNumberRules()
        return NextResponse.json({ rules })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const payload = verifyToken(token)

        if (!payload || !payload.isAdmin) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const { rules } = await request.json()
        if (!rules || !Array.isArray(rules)) {
            return NextResponse.json({ error: '잘못된 형식의 규칙입니다.' }, { status: 400 })
        }

        const success = await db.saveMemberNumberRules(rules)
        if (!success) {
            throw new Error('규칙 저장 실패')
        }

        return NextResponse.json({ message: '회원번호별 규칙이 저장되었습니다.', rules })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
