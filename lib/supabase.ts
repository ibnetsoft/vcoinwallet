import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ?´ë¼?´ì–¸???¬ì´?œìš© Supabase ?´ë¼?´ì–¸??(ë¸Œë¼?°ì??ì„œ ?¬ìš©)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ?œë²„ ?¬ì´?œìš© Supabase ?´ë¼?´ì–¸??(ê´€ë¦¬ì ê¶Œí•œ, API ?¼ìš°?¸ì—???¬ìš©)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// TypeScript ?€???•ì˜
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
  role?: 'ADMIN' | 'TEAM_LEADER' | 'GROUP_LEADER' | 'USER'
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
