import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const OLD_JWT_SECRET = 'your-secret-key-change-in-production'

export function verifyToken(token: string): any {
  // Vercel에 설정된 JWT_SECRET이 있으면 그것으로 시도
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== OLD_JWT_SECRET) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      // 실패하면 구 시크릿으로 시도
      console.log('New JWT_SECRET failed, trying old secret...')
      return jwt.verify(token, OLD_JWT_SECRET)
    }
  }

  // JWT_SECRET이 없거나 기본값이면 기본값으로만 시도
  return jwt.verify(token, OLD_JWT_SECRET)
}

export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
