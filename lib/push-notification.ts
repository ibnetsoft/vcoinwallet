import webpush from 'web-push'
import { db } from './db'
import { sendFCMNotification } from './fcm-push'

// VAPID 키 설정 (환경변수에서 읽기)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidEmail = process.env.VAPID_EMAIL || 'admin@3dvcoin.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  )
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
}

/**
 * 특정 사용자에게 푸시 알림 전송 (Web Push + FCM)
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  let webPushSuccess = false
  let fcmSuccess = false

  // 1. Web Push 전송 (브라우저/PWA용)
  try {
    const subscriptions = await db.getPushSubscriptions(userId)

    if (subscriptions.length > 0) {
      const pushPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/vcoin_logo.png',
              badge: payload.badge || '/vcoin_logo.png',
              data: payload.data,
            })
          )

          return true
        } catch (error: any) {
          console.error('Web Push error:', error)
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Subscription expired, removing: ${sub.id}`)
          }
          return false
        }
      })

      const results = await Promise.all(pushPromises)
      webPushSuccess = results.some((result) => result === true)
    }
  } catch (error) {
    console.error('Web Push send error:', error)
  }

  // 2. FCM 전송 (Android 앱용)
  try {
    const dataPayload: Record<string, string> = {}
    if (payload.data) {
      Object.keys(payload.data).forEach(key => {
        dataPayload[key] = String(payload.data[key])
      })
    }

    fcmSuccess = await sendFCMNotification(userId, {
      title: payload.title,
      body: payload.body,
      data: dataPayload,
    })
  } catch (error) {
    console.error('FCM send error:', error)
  }

  return webPushSuccess || fcmSuccess
}

/**
 * 추천인 가입 알림 전송
 */
export async function sendReferralSignupNotification(
  referrerId: string,
  newUserName: string,
  newUserMemberNumber: number
): Promise<void> {
  console.log(`[추천인알림] 시작 - referrerId: ${referrerId}, newUser: ${newUserName}, memberNumber: ${newUserMemberNumber}`)

  try {
    // 인앱 알림 생성
    console.log(`[추천인알림] 인앱 알림 생성 중...`)
    await db.createNotification(
      referrerId,
      'REFERRAL_SIGNUP',
      '새로운 회원이 가입했습니다! 🎉',
      `${newUserName}님(회원번호: ${newUserMemberNumber})이 회원님의 추천으로 가입했습니다.`,
      undefined
    )
    console.log(`[추천인알림] 인앱 알림 생성 완료`)

    // 푸시 알림 전송
    console.log(`[추천인알림] 푸시 알림 전송 시작...`)
    const pushResult = await sendPushNotification(referrerId, {
      title: '새로운 회원이 가입했습니다! 🎉',
      body: `${newUserName}님(회원번호: ${newUserMemberNumber})이 회원님의 추천으로 가입했습니다.`,
      data: {
        type: 'REFERRAL_SIGNUP',
        newUserMemberNumber,
      },
    })
    console.log(`[추천인알림] 푸시 알림 전송 결과: ${pushResult ? '성공' : '실패'}`)
  } catch (error) {
    console.error('[추천인알림] 오류 발생:', error)
  }
}

/**
 * 코인 지급 알림 전송
 */
export async function sendCoinGrantedNotification(
  userId: string,
  coinType: string,
  amount: number,
  description: string
): Promise<void> {
  try {
    const coinTypeName = coinType === 'SECURITY' ? '증권코인' : '배당코인'

    // 인앱 알림 생성
    await db.createNotification(
      userId,
      'COIN_GRANTED',
      `${coinTypeName}이 지급되었습니다!`,
      `${amount.toLocaleString()}개의 ${coinTypeName}이 지급되었습니다. (${description})`,
      undefined
    )

    // 푸시 알림 전송
    await sendPushNotification(userId, {
      title: `${coinTypeName}이 지급되었습니다!`,
      body: `${amount.toLocaleString()}개의 ${coinTypeName}이 지급되었습니다. (${description})`,
      data: {
        type: 'COIN_GRANTED',
        coinType,
        amount,
      },
    })
  } catch (error) {
    console.error('Send coin granted notification error:', error)
  }
}
