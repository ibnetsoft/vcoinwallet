// 서버 사이드에서만 실행되는 Firebase Admin SDK
// 이 파일은 API 라우트에서만 import해야 합니다

let admin: any = null
let messaging: any = null

// 지연 초기화 함수
async function initializeFirebaseAdmin() {
  if (admin) return admin

  // 서버 사이드에서만 실행
  if (typeof window !== 'undefined') {
    console.error('Firebase Admin은 서버에서만 사용할 수 있습니다.')
    return null
  }

  try {
    // @ts-ignore - 서버 사이드에서만 사용되는 모듈
    const firebaseAdmin = await import('firebase-admin')
    admin = firebaseAdmin.default

    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY

      if (!projectId || !clientEmail || !privateKey) {
        console.log('Firebase Admin: 환경변수가 설정되지 않았습니다.')
        return null
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
      console.log('Firebase Admin initialized successfully')
    }

    messaging = admin.messaging()
    return admin
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    return null
  }
}

// FCM 메시지 전송
export async function sendFCMMessage(message: {
  token: string
  notification: { title: string; body: string }
  data?: Record<string, string>
}) {
  await initializeFirebaseAdmin()
  if (!messaging) {
    throw new Error('Firebase Admin not initialized')
  }

  return messaging.send({
    ...message,
    android: {
      priority: 'high' as const,
      notification: {
        icon: 'ic_launcher',
        color: '#F59E0B',
        channelId: 'vcoin_notifications',
      },
    },
  })
}

// 여러 기기에 FCM 메시지 전송
export async function sendFCMMulticast(message: {
  tokens: string[]
  notification: { title: string; body: string }
  data?: Record<string, string>
}) {
  await initializeFirebaseAdmin()
  if (!messaging) {
    throw new Error('Firebase Admin not initialized')
  }

  return messaging.sendEachForMulticast({
    ...message,
    android: {
      priority: 'high' as const,
      notification: {
        icon: 'ic_launcher',
        color: '#F59E0B',
        channelId: 'vcoin_notifications',
      },
    },
  })
}
