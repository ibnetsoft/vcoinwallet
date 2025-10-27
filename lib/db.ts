import { supabaseAdmin } from './supabase'
import { generateReferralCode, calculateSignupBonus } from './auth'

interface User {
  id: string
  name: string
  phone: string
  email?: string
  password: string
  referralCode: string
  referrerId?: string
  securityCoins: number
  dividendCoins: number
  memberNumber: number
  role: 'ADMIN' | 'TEAM_LEADER' | 'USER'
  isAdmin: boolean
  status?: 'ACTIVE' | 'BLOCKED' | 'DELETED'
  createdAt: string
  updatedAt?: string
}

interface Transaction {
  id: string
  userId: string
  type: string
  coinType: string
  amount: number
  balance: number
  description?: string
  referralId?: string
  createdAt: string
}

interface SystemConfig {
  securityCoinNewUser: number
  securityCoinReferral: number
  dividendCoinPer100: number
  dividendCoinReferralPercentage: number  // 백분율 (기본값: 10 = 10%)
}

// Supabase 기반 데이터베이스 함수들
export const db = {
  // 사용자 찾기
  async findUserByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) return null
    return data ? convertFromSupabaseUser(data) : null
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data ? convertFromSupabaseUser(data) : null
  },

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data ? convertFromSupabaseUser(data) : null
  },

  async findUserByReferralCode(code: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('referral_code', code)
      .single()

    if (error) return null
    return data ? convertFromSupabaseUser(data) : null
  },

  // 사용자 생성
  async createUser(data: {
    name: string
    phone: string
    email?: string
    password: string
    referralCode?: string
  }): Promise<User> {
    // 다음 회원번호 가져오기
    const { data: metaData } = await supabaseAdmin
      .from('metadata')
      .select('value')
      .eq('key', 'next_member_number')
      .single()

    const memberNumber = metaData?.value || 1

    // 회원번호 증가
    await supabaseAdmin
      .from('metadata')
      .update({ value: memberNumber + 1, updated_at: new Date().toISOString() })
      .eq('key', 'next_member_number')

    // 보너스 계산
    const { securityCoins, referralBonus } = calculateSignupBonus(memberNumber)

    // 추천인 확인
    let referrer = null
    if (data.referralCode) {
      referrer = await this.findUserByReferralCode(data.referralCode)
    }

    // 새 사용자 생성
    const newUserId = Date.now().toString()
    const newUser = {
      id: newUserId,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      password: data.password, // 평문 저장
      referral_code: generateReferralCode(),
      referred_by: referrer?.id,  // 추천인의 ID 저장 (추천코드가 아님)
      security_coins: securityCoins,
      dividend_coins: 0,
      member_number: memberNumber,
      role: 'USER',
      is_admin: false,
      created_at: new Date().toISOString()
    }

    const { data: insertedUser, error } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) throw new Error('사용자 생성 실패: ' + error.message)

    // 가입 보너스 거래 기록
    await supabaseAdmin.from('transactions').insert({
      id: Date.now().toString(),
      user_id: newUserId,
      type: 'SIGNUP_BONUS',
      coin_type: 'SECURITY',
      amount: securityCoins,
      balance: securityCoins,
      description: `회원가입 보너스 (회원번호: ${memberNumber})`,
      created_at: new Date().toISOString()
    })

    // 추천인 보너스 지급
    if (referrer) {
      const newSecurityCoins = referrer.securityCoins + referralBonus

      await supabaseAdmin
        .from('users')
        .update({ security_coins: newSecurityCoins })
        .eq('id', referrer.id)

      await supabaseAdmin.from('transactions').insert({
        id: (Date.now() + 1).toString(),
        user_id: referrer.id,
        type: 'REFERRAL_BONUS',
        coin_type: 'SECURITY',
        amount: referralBonus,
        balance: newSecurityCoins,
        description: `추천 보너스 - ${newUser.name}님 가입`,
        created_at: new Date().toISOString()
      })
    }

    return convertFromSupabaseUser(insertedUser)
  },

  // 배당코인 지급
  async grantDividendCoins(userId: string, amount: number, description?: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user) return false

    const newBalance = user.dividendCoins + amount

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ dividend_coins: newBalance })
      .eq('id', userId)

    if (updateError) return false

    // 거래 기록
    await supabaseAdmin.from('transactions').insert({
      id: Date.now().toString(),
      user_id: userId,
      type: 'ADMIN_GRANT',
      coin_type: 'DIVIDEND',
      amount: amount,
      balance: newBalance,
      description: description || '관리자 지급',
      created_at: new Date().toISOString()
    })

    // 추천인에게 보너스 지급 (백분율 계산)
    if (user.referrerId) {
      const referrer = await this.findUserById(user.referrerId)
      if (referrer) {
        const config = await this.getSystemConfig()
        // 추천받은 회원이 받은 금액의 X%를 추천인에게 지급
        const referralBonus = Math.floor(amount * config.dividendCoinReferralPercentage / 100)
        const referrerNewBalance = referrer.dividendCoins + referralBonus

        await supabaseAdmin
          .from('users')
          .update({ dividend_coins: referrerNewBalance })
          .eq('id', referrer.id)

        await supabaseAdmin.from('transactions').insert({
          id: (Date.now() + 1).toString(),
          user_id: referrer.id,
          type: 'REFERRAL_BONUS',
          coin_type: 'DIVIDEND',
          amount: referralBonus,
          balance: referrerNewBalance,
          description: `추천 보너스 - ${user.name}님 배당코인 구매 (${config.dividendCoinReferralPercentage}%)`,
          created_at: new Date().toISOString()
        })
      }
    }

    return true
  },

  // 배당코인 설정 (덮어쓰기)
  async setDividendCoins(userId: string, amount: number, description?: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user) return false

    const { error } = await supabaseAdmin
      .from('users')
      .update({ dividend_coins: amount })
      .eq('id', userId)

    if (error) return false

    // 거래 기록
    await supabaseAdmin.from('transactions').insert({
      id: Date.now().toString(),
      user_id: userId,
      type: 'ADMIN_GRANT',
      coin_type: 'DIVIDEND',
      amount: amount - user.dividendCoins,
      balance: amount,
      description: description || '관리자 배당코인 설정',
      created_at: new Date().toISOString()
    })

    return true
  },

  // 모든 사용자 조회
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return []
    return data.map(convertFromSupabaseUser)
  },

  // 거래 내역 조회
  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return []
    return data.map(convertFromSupabaseTransaction)
  },

  // 모든 거래 내역 조회
  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return []
    return data.map(convertFromSupabaseTransaction)
  },

  // 사용자 등급 변경
  async setUserRole(userId: string, role: 'USER' | 'TEAM_LEADER'): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) return null
    return convertFromSupabaseUser(data)
  },

  // 사용자 차단
  async blockUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user || user.role === 'ADMIN') return false

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status: 'BLOCKED' })
      .eq('id', userId)

    return !error
  },

  // 사용자 차단 해제
  async unblockUser(userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('id', userId)

    return !error
  },

  // 사용자 탈퇴
  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user || user.role === 'ADMIN') return false

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status: 'DELETED' })
      .eq('id', userId)

    return !error
  },

  // 추천인 목록
  async getReferredUsers(userId: string): Promise<User[]> {
    const user = await this.findUserById(userId)
    if (!user) return []

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('referred_by', user.referralCode)
      .order('created_at', { ascending: false })

    if (error) return []
    return data.map(convertFromSupabaseUser)
  },

  // 시스템 설정 조회
  async getSystemConfig(): Promise<SystemConfig> {
    // 기본값 반환 (필요시 metadata 테이블에서 읽도록 확장 가능)
    return {
      securityCoinNewUser: 500,
      securityCoinReferral: 1000,
      dividendCoinPer100: 10000,
      dividendCoinReferralPercentage: 10  // 10% (추천받은 회원이 받은 배당코인의 10%)
    }
  },

  // 사용자 정보 업데이트
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const supabaseUpdates: any = {}

    if (updates.name) supabaseUpdates.name = updates.name
    if (updates.email) supabaseUpdates.email = updates.email
    if (updates.phone) supabaseUpdates.phone = updates.phone
    if (updates.password) supabaseUpdates.password = updates.password

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(supabaseUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) return null
    return convertFromSupabaseUser(data)
  }
}

// Supabase 스네이크 케이스를 카멜 케이스로 변환
function convertFromSupabaseUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    name: supabaseUser.name,
    phone: supabaseUser.phone,
    email: supabaseUser.email,
    password: supabaseUser.password,
    referralCode: supabaseUser.referral_code,
    referrerId: supabaseUser.referred_by,
    securityCoins: supabaseUser.security_coins,
    dividendCoins: supabaseUser.dividend_coins,
    memberNumber: supabaseUser.member_number,
    role: supabaseUser.role,
    isAdmin: supabaseUser.is_admin,
    status: supabaseUser.status,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at
  }
}

function convertFromSupabaseTransaction(supabaseTx: any): Transaction {
  return {
    id: supabaseTx.id,
    userId: supabaseTx.user_id,
    type: supabaseTx.type,
    coinType: supabaseTx.coin_type,
    amount: supabaseTx.amount,
    balance: supabaseTx.balance,
    description: supabaseTx.description,
    referralId: supabaseTx.referral_id,
    createdAt: supabaseTx.created_at
  }
}
