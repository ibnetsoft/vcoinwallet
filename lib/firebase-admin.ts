import admin from 'firebase-admin'

// Firebase Admin 초기화 함수 (지연 초기화)
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // 환경변수가 없으면 초기화하지 않음
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.log('Firebase Admin: 환경변수가 설정되지 않았습니다.')
        return null
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
      console.log('Firebase Admin initialized successfully')
    } catch (error) {
      console.error('Firebase Admin initialization error:', error)
      return null
    }
  }
  return admin
}

// 지연 초기화된 messaging 인스턴스
function getMessaging() {
  const firebaseAdmin = getFirebaseAdmin()
  if (!firebaseAdmin) return null
  return firebaseAdmin.messaging()
}

export const firebaseAdmin = admin
export const messaging = {
  send: async (message: admin.messaging.Message) => {
    const m = getMessaging()
    if (!m) throw new Error('Firebase Admin not initialized')
    return m.send(message)
  },
  sendEachForMulticast: async (message: admin.messaging.MulticastMessage) => {
    const m = getMessaging()
    if (!m) throw new Error('Firebase Admin not initialized')
    return m.sendEachForMulticast(message)
  }
}
