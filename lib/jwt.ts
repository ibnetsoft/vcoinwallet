import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const OLD_JWT_SECRET = 'your-secret-key-change-in-production'

export function verifyToken(token: string): any {
  // 새 JWT_SECRET으로 시도
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    // 실패하면 구 JWT_SECRET으로 시도
    try {
      return jwt.verify(token, OLD_JWT_SECRET)
    } catch (oldError) {
      throw error // 원래 에러를 던짐
    }
  }
}

export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
