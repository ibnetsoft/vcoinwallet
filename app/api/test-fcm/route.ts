import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendFCMMessageREST } from '@/lib/fcm-rest'
import { sendFCMNotification } from '@/lib/fcm-push'

// GET: FCM 테스트 푸시 전송 (REST API 사용)
export async function GET(request: NextRequest) {
  try {
    // 환경변수 확인
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0
    }

    console.log('FCM Test (REST API) - Environment check:', envCheck)

    // 모든 FCM 토큰 조회
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (tokenError) {
      return NextResponse.json({
        success: false,
        error: 'FCM 토큰 조회 실패',
        details: tokenError.message,
        envCheck
      }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FCM 토큰이 없습니다',
        envCheck
      }, { status: 404 })
    }

    console.log(`FCM 테스트: ${tokens.length}개의 토큰 발견`)

    // 각 토큰에 테스트 메시지 전송
    const results = []
    for (const tokenData of tokens) {
      try {
        console.log(`토큰 전송 시도: ${tokenData.token.substring(0, 30)}...`)

        const messageId = await sendFCMMessageREST({
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
          messageId
        })
        console.log(`토큰 전송 성공: ${messageId}`)
      } catch (sendError: any) {
        console.error(`토큰 전송 실패:`, sendError)
        results.push({
          token: tokenData.token.substring(0, 30) + '...',
          user_id: tokenData.user_id,
          success: false,
          error: sendError.message || 'Unknown error'
        })

        // 유효하지 않은 토큰은 삭제
        if (
          sendError.message?.includes('UNREGISTERED') ||
          sendError.message?.includes('INVALID_ARGUMENT')
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
      envCheck,
      results
    })
  } catch (error: any) {
    console.error('FCM 테스트 오류:', error)
    return NextResponse.json({
      success: false,
      error: 'FCM 테스트 실패',
      details: error.message || error.toString(),
      envCheck: {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
      }
    }, { status: 500 })
  }
}

// POST: 특정 userId로 FCM 테스트 (추천인 알림 테스트용)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId가 필요합니다'
      }, { status: 400 })
    }

    console.log(`[테스트] userId ${userId}로 FCM 전송 시도`)

    // 해당 userId의 토큰 확인
    const { data: tokens } = await supabaseAdmin
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)

    console.log(`[테스트] userId ${userId}의 토큰:`, tokens)

    // sendFCMNotification 사용 (추천인 알림과 동일한 방식)
    const result = await sendFCMNotification(userId, {
      title: '🎉 추천인 알림 테스트',
      body: `테스트: 새 회원이 가입했습니다! 시간: ${new Date().toLocaleTimeString('ko-KR')}`,
      data: {
        type: 'REFERRAL_SIGNUP',
        test: 'true'
      }
    })

    return NextResponse.json({
      success: result,
      message: result ? 'FCM 전송 성공' : 'FCM 전송 실패 (토큰 없음 또는 오류)',
      userId,
      tokensFound: tokens?.length || 0,
      tokens: tokens?.map(t => ({
        token: t.token.substring(0, 30) + '...',
        user_id: t.user_id,
        created_at: t.created_at
      }))
    })
  } catch (error: any) {
    console.error('FCM userId 테스트 오류:', error)
    return NextResponse.json({
      success: false,
      error: error.message || error.toString()
    }, { status: 500 })
  }
}
