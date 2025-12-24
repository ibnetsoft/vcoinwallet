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
    // 1. 추천인(직계)에게 알림 전송 (기존 로직)
    console.log(`[추천인알림] 인앱 알림 생성 중...`)
    await db.createNotification(
      referrerId,
      'REFERRAL_SIGNUP',
      '새로운 회원이 가입했습니다! 🎉',
      `${newUserName}님(회원번호: ${newUserMemberNumber})이 회원님의 추천으로 가입했습니다.`,
      undefined
    )
    console.log(`[추천인알림] 인앱 알림 생성 완료`)

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

    // 2. 상위 팀장 및 그룹장 찾기 (추가 로직)
    // 추천인으로부터 상위로 올라가며 팀장과 그룹장을 찾음
    let currentUserId: string | undefined = referrerId
    let teamLeaderId: string | null = null
    let groupLeaderId: string | null = null
    let depth = 0
    const MAX_DEPTH = 30

    while (currentUserId && depth < MAX_DEPTH) {
      if (teamLeaderId && groupLeaderId) break

      const user = await db.findUserById(currentUserId)
      if (!user) break

      // 역할 확인
      if (!teamLeaderId && user.role === 'TEAM_LEADER') {
        teamLeaderId = user.id
      }
      if (!groupLeaderId && user.role === 'GROUP_LEADER') {
        groupLeaderId = user.id
      }

      // 상위 추천인으로 이동
      currentUserId = user.referrerId
      depth++
    }

    // 3. 팀장에게 알림 전송 (추천인 본인이 팀장이 아닌 경우에만)
    if (teamLeaderId && teamLeaderId !== referrerId) {
      console.log(`[추천인알림] 상위 팀장에게 알림 전송: ${teamLeaderId}`)

      const tlTitle = '팀 산하 신규 회원 가입! 👥'
      const tlBody = `팀 내에 ${newUserName}님(회원번호: ${newUserMemberNumber})이 가입했습니다.`

      // 인앱 알림
      await db.createNotification(
        teamLeaderId,
        'REFERRAL_SIGNUP',
        tlTitle,
        tlBody,
        undefined
      )

      // 푸시 알림
      await sendPushNotification(teamLeaderId, {
        title: tlTitle,
        body: tlBody,
        data: {
          type: 'REFERRAL_SIGNUP',
          newUserMemberNumber,
          roleTarget: 'TEAM_LEADER'
        }
      })
    }

    // 4. 그룹장에게 알림 전송 (추천인이나 팀장과 중복되지 않는 경우에만)
    if (groupLeaderId && groupLeaderId !== referrerId && groupLeaderId !== teamLeaderId) {
      console.log(`[추천인알림] 상위 그룹장에게 알림 전송: ${groupLeaderId}`)

      const glTitle = '그룹 산하 신규 회원 가입! 🏢'
      const glBody = `그룹 내에 ${newUserName}님(회원번호: ${newUserMemberNumber})이 가입했습니다.`

      // 인앱 알림
      await db.createNotification(
        groupLeaderId,
        'REFERRAL_SIGNUP',
        glTitle,
        glBody,
        undefined
      )

      // 푸시 알림
      await sendPushNotification(groupLeaderId, {
        title: glTitle,
        body: glBody,
        data: {
          type: 'REFERRAL_SIGNUP',
          newUserMemberNumber,
          roleTarget: 'GROUP_LEADER'
        }
      })
    }

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
