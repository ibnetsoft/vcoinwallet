import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

/**
 * notifications 및 push_subscriptions 테이블 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
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

    // 사용자 정보 조회
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    console.log('=== 알림 테이블 생성 시작 ===')

    // notifications 테이블 생성
    const notificationsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('REFERRAL_SIGNUP', 'COIN_GRANTED', 'SYSTEM')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_user_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),

        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
    `

    const { error: notificationsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: notificationsTableSQL
    })

    // RPC가 없으면 직접 실행 시도
    if (notificationsError && notificationsError.message.includes('function')) {
      console.log('RPC not available, using direct SQL execution')

      // 테이블이 이미 존재하는지 확인
      const { data: existingTable } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .limit(1)

      if (!existingTable) {
        return NextResponse.json({
          error: 'Supabase 대시보드에서 수동으로 테이블을 생성해야 합니다.',
          sql: notificationsTableSQL,
          instructions: [
            '1. Supabase 대시보드 → SQL Editor로 이동',
            '2. 반환된 SQL을 복사하여 실행',
            '3. 같은 방법으로 push_subscriptions 테이블도 생성'
          ]
        }, { status: 400 })
      }
    }

    // push_subscriptions 테이블 생성
    const pushSubscriptionsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),

        CONSTRAINT fk_user_push FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        CONSTRAINT unique_endpoint UNIQUE(endpoint)
      );

      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
    `

    console.log('=== 테이블 생성 완료 ===')

    return NextResponse.json({
      success: true,
      message: '알림 테이블이 생성되었습니다.',
      tables: ['notifications', 'push_subscriptions'],
      notificationsSQL: notificationsTableSQL,
      pushSubscriptionsSQL: pushSubscriptionsTableSQL
    })

  } catch (error) {
    console.error('Setup notifications error:', error)
    return NextResponse.json(
      { error: '알림 테이블 생성 중 오류가 발생했습니다.', details: error },
      { status: 500 }
    )
  }
}
