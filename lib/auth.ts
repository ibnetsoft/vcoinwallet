import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface TokenPayload {
  userId: string
  phone: string
  isAdmin: boolean
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const createToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  })
}

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}

// 추천 코드 생성
export const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 코인 지급 규칙 계산
export const calculateSignupBonus = (memberNumber: number): { securityCoins: number; referralBonus: number } => {
  if (memberNumber <= 10000) {
    return { securityCoins: 500, referralBonus: 1000 }
  } else if (memberNumber <= 20000) {
    return { securityCoins: 200, referralBonus: 400 }
  } else if (memberNumber <= 100000) {
    return { securityCoins: 100, referralBonus: 200 }
  }
  return { securityCoins: 50, referralBonus: 100 } // 10만명 이후
}
