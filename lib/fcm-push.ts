import { supabaseAdmin } from './supabase'
import { sendFCMMessageREST, sendFCMMulticastREST } from './fcm-rest'

export interface FCMPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * FCM 토큰 저장
 */
export async function saveFCMToken(userId: string, token: string): Promise<boolean> {
  try {
    // 기존 토큰 확인
    const { data: existing } = await supabaseAdmin
      .from('fcm_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .single()

    if (existing) {
      // 이미 존재하면 updated_at만 갱신
      await supabaseAdmin
        .from('fcm_tokens')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // 새 토큰 저장
      await supabaseAdmin
        .from('fcm_tokens')
        .insert({
          user_id: userId,
          token: token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
    return true
  } catch (error) {
    console.error('FCM 토큰 저장 오류:', error)
    return false
  }
}

/**
 * 특정 사용자에게 FCM 푸시 알림 전송
 */
export async function sendFCMNotification(
  userId: string,
  payload: FCMPayload
): Promise<boolean> {
  console.log(`[FCM] sendFCMNotification 시작 - userId: ${userId}, title: ${payload.title}`)

  try {
    // 사용자의 FCM 토큰 조회
    const { data: tokens, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId)

    console.log(`[FCM] 토큰 조회 결과 - userId: ${userId}, 토큰 수: ${tokens?.length || 0}, 에러: ${error?.message || 'none'}`)

    if (error || !tokens || tokens.length === 0) {
      console.log(`[FCM] 토큰 없음 - userId: ${userId} (추천인이 앱에서 알림을 활성화하지 않았을 수 있음)`)
      return false
    }

    // 모든 토큰에 푸시 전송
    console.log(`[FCM] ${tokens.length}개 토큰에 푸시 전송 시작`)
    const sendPromises = tokens.map(async ({ token }) => {
      try {
        console.log(`[FCM] 토큰 전송 시도: ${token.substring(0, 20)}...`)
        await sendFCMMessageREST({
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data,
        })
        console.log(`[FCM] 토큰 전송 성공: ${token.substring(0, 20)}...`)
        return true
      } catch (sendError: any) {
        console.error(`[FCM] 토큰 전송 실패: ${token.substring(0, 20)}... 에러: ${sendError.message}`)
        // 토큰이 만료되었거나 유효하지 않은 경우 삭제
        if (
          sendError.message?.includes('UNREGISTERED') ||
          sendError.message?.includes('INVALID_ARGUMENT')
        ) {
          console.log(`[FCM] 유효하지 않은 토큰 삭제: ${token.substring(0, 20)}...`)
          await supabaseAdmin
            .from('fcm_tokens')
            .delete()
            .eq('token', token)
        }
        return false
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r).length
    console.log(`[FCM] 전송 완료 - 성공: ${successCount}/${tokens.length}`)
    return results.some((result) => result === true)
  } catch (error) {
    console.error('[FCM] 푸시 전송 오류:', error)
    return false
  }
}

/**
 * 여러 사용자에게 FCM 푸시 알림 전송
 */
export async function sendFCMToMultipleUsers(
  userIds: string[],
  payload: FCMPayload
): Promise<void> {
  const promises = userIds.map((userId) => sendFCMNotification(userId, payload))
  await Promise.all(promises)
}

/**
 * 모든 사용자에게 FCM 푸시 알림 전송 (공지사항 등)
 */
export async function sendFCMToAllUsers(payload: FCMPayload): Promise<void> {
  try {
    // 모든 FCM 토큰 조회
    const { data: tokens, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')

    if (error || !tokens || tokens.length === 0) {
      console.log('No FCM tokens found')
      return
    }

    // 토큰 배열 추출
    const tokenList = tokens.map((t) => t.token)

    // 500개씩 나눠서 전송 (FCM 제한)
    const chunkSize = 500
    for (let i = 0; i < tokenList.length; i += chunkSize) {
      const chunk = tokenList.slice(i, i + chunkSize)

      try {
        await sendFCMMulticastREST({
          tokens: chunk,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data,
        })
      } catch (sendError) {
        console.error('FCM multicast send error:', sendError)
      }
    }
  } catch (error) {
    console.error('FCM 전체 푸시 전송 오류:', error)
  }
}
