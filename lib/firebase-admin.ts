// 서버 사이드에서만 실행되는 Firebase Admin SDK
// 이 파일은 API 라우트에서만 import해야 합니다

let admin: any = null
let messaging: any = null

// 지연 초기화 함수
async function initializeFirebaseAdmin() {
  if (admin && messaging) return admin

  // 서버 사이드에서만 실행
  if (typeof window !== 'undefined') {
    console.error('Firebase Admin은 서버에서만 사용할 수 있습니다.')
    return null
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const firebaseAdmin = require('firebase-admin')
    admin = firebaseAdmin

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    console.log('Firebase ENV:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length
    })

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase Admin: 환경변수 누락 - projectId:', !!projectId, 'clientEmail:', !!clientEmail, 'privateKey:', !!privateKey)
      return null
    }

    if (!admin.apps.length) {
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
    console.log('Firebase Messaging ready')
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
