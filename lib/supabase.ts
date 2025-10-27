import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 클라이언트 사이드용 Supabase 클라이언트 (브라우저에서 사용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드용 Supabase 클라이언트 (관리자 권한, API 라우트에서 사용)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// TypeScript 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'createdAt'>
        Update: Partial<Omit<User, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'createdAt'>
        Update: Partial<Omit<Transaction, 'id'>>
      }
    }
  }
}

export interface User {
  id: string
  memberNumber: number
  email: string
  password: string
  name: string
  phone: string
  referralCode: string
  referredBy?: string
  securityCoins: number
  dividendCoins: number
  role?: 'ADMIN' | 'TEAM_LEADER' | 'USER'
  isAdmin?: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'SIGNUP_BONUS' | 'REFERRAL_BONUS' | 'ADMIN_GRANT' | 'CONVERSION'
  coinType: 'SECURITY' | 'DIVIDEND'
  amount: number
  balance: number
  description: string
  createdAt: string
}
