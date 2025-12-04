import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Firebase Admin 직접 초기화
let admin: any = null
let messaging: any = null

async function getFirebaseAdmin() {
  if (messaging) return messaging

  try {
    const firebaseAdmin = require('firebase-admin')
    admin = firebaseAdmin

    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY

      console.log('Firebase ENV check:', {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey?.length,
        privateKeyStart: privateKey?.substring(0, 50)
      })

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(`Missing env: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`)
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
      console.log('Firebase Admin initialized!')
    }

    messaging = admin.messaging()
    return messaging
  } catch (error: any) {
    console.error('Firebase init error:', error)
    throw error
  }
}

// GET: FCM 테스트 푸시 전송 v2
export async function GET(request: NextRequest) {
  try {
    // Firebase 초기화 먼저 시도
    let firebaseMessaging
    try {
      firebaseMessaging = await getFirebaseAdmin()
    } catch (initError: any) {
      return NextResponse.json({
        success: false,
        error: 'Firebase 초기화 실패',
        details: initError.message,
        env: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        }
      }, { status: 500 })
    }

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

        const result = await firebaseMessaging.send({
          token: tokenData.token,
          notification: {
            title: '🔔 V COIN 테스트 알림',
            body: `테스트 메시지입니다. 시간: ${new Date().toLocaleTimeString('ko-KR')}`
          },
          data: {
            type: 'TEST',
            timestamp: Date.now().toString()
          },
          android: {
            priority: 'high' as const,
            notification: {
              channelId: 'vcoin_notifications',
              icon: 'ic_launcher',
              color: '#F59E0B'
            }
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
