// Firebase Cloud Messaging REST API 구현
// firebase-admin SDK 대신 HTTP API를 직접 사용
// Web Crypto API 사용 (Edge Runtime 호환)

interface JWTHeader {
  alg: string
  typ: string
}

interface JWTPayload {
  iss: string
  scope: string
  aud: string
  iat: number
  exp: number
}

// Base64 URL 인코딩
function base64urlEncode(data: string | ArrayBuffer): string {
  let base64: string
  if (typeof data === 'string') {
    base64 = Buffer.from(data).toString('base64')
  } else {
    base64 = Buffer.from(data).toString('base64')
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// PEM 형식의 private key에서 raw key 추출
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = Buffer.from(base64, 'base64')
  return binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
}

// RSA-SHA256 서명 생성 (Web Crypto API)
async function signRS256(data: string, privateKeyPem: string): Promise<string> {
  const keyData = pemToArrayBuffer(privateKeyPem)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataBuffer
  )

  return base64urlEncode(signature)
}

// Google OAuth2 Access Token 생성
async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Firebase credentials not configured')
  }

  const now = Math.floor(Date.now() / 1000)

  const header: JWTHeader = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const payload: JWTPayload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }

  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = await signRS256(signatureInput, privateKey)
  const jwt = `${signatureInput}.${signature}`

  // Google OAuth2 토큰 요청
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OAuth2 token error:', error)
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// FCM 메시지 전송
export async function sendFCMMessageREST(message: {
  token: string
  notification: { title: string; body: string }
  data?: Record<string, string>
}): Promise<string> {
  const projectId = process.env.FIREBASE_PROJECT_ID

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID not configured')
  }

  const accessToken = await getAccessToken()

  const fcmMessage = {
    message: {
      token: message.token,
      notification: message.notification,
      data: message.data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_launcher',
          color: '#F59E0B',
          channel_id: 'vcoin_notifications',
          default_sound: true,
          default_vibrate_timings: true
        }
      }
    }
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fcmMessage)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('FCM send error:', error)
    throw new Error(`FCM send failed: ${error}`)
  }

  const result = await response.json()
  return result.name // 메시지 ID
}

// 여러 기기에 FCM 메시지 전송
export async function sendFCMMulticastREST(message: {
  tokens: string[]
  notification: { title: string; body: string }
  data?: Record<string, string>
}): Promise<{ successCount: number; failureCount: number; results: any[] }> {
  const results = []
  let successCount = 0
  let failureCount = 0

  for (const token of message.tokens) {
    try {
      const messageId = await sendFCMMessageREST({
        token,
        notification: message.notification,
        data: message.data
      })
      results.push({ token: token.substring(0, 30) + '...', success: true, messageId })
      successCount++
    } catch (error: any) {
      results.push({ token: token.substring(0, 30) + '...', success: false, error: error.message })
      failureCount++
    }
  }

  return { successCount, failureCount, results }
}
