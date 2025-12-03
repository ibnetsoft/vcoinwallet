import { NextRequest, NextResponse } from 'next/server'
import { sendFCMMessage } from '@/lib/firebase-admin'
import { supabaseAdmin } from '@/lib/supabase'

// GET: FCM 테스트 푸시 전송
export async function GET(request: NextRequest) {
  try {
    // 모든 FCM 토큰 조회
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (tokenError) {
      return NextResponse.json({
        success: false,
        error: 'FCM 토큰 조회 실패',
        details: tokenError.message
      }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FCM 토큰이 없습니다'
      }, { status: 404 })
    }

    console.log(`FCM 테스트: ${tokens.length}개의 토큰 발견`)

    // 각 토큰에 테스트 메시지 전송
    const results = []
    for (const tokenData of tokens) {
      try {
        console.log(`토큰 전송 시도: ${tokenData.token.substring(0, 30)}...`)

        const result = await sendFCMMessage({
          token: tokenData.token,
          notification: {
            title: '🔔 V COIN 테스트 알림',
            body: `테스트 메시지입니다. 시간: ${new Date().toLocaleTimeString('ko-KR')}`
          },
          data: {
            type: 'TEST',
            timestamp: Date.now().toString()
          }
        })

        results.push({
          token: tokenData.token.substring(0, 30) + '...',
          user_id: tokenData.user_id,
          success: true,
          messageId: result
        })
        console.log(`토큰 전송 성공: ${result}`)
      } catch (sendError: any) {
        console.error(`토큰 전송 실패:`, sendError)
        results.push({
          token: tokenData.token.substring(0, 30) + '...',
          user_id: tokenData.user_id,
          success: false,
          error: sendError.message || sendError.code || 'Unknown error'
        })

        // 유효하지 않은 토큰은 삭제
        if (
          sendError.code === 'messaging/invalid-registration-token' ||
          sendError.code === 'messaging/registration-token-not-registered'
        ) {
          await supabaseAdmin
            .from('fcm_tokens')
            .delete()
            .eq('token', tokenData.token)
          console.log(`유효하지 않은 토큰 삭제됨`)
        }
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount}/${tokens.length}개 토큰에 전송 완료`,
      totalTokens: tokens.length,
      successCount,
      results
    })
  } catch (error: any) {
    console.error('FCM 테스트 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'FCM 테스트 실패',
      details: error.message || error.toString()
    }, { status: 500 })
  }
}
