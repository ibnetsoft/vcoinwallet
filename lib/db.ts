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

interface Notification {
  id: string
  userId: string
  type: 'REFERRAL_SIGNUP' | 'COIN_GRANTED' | 'SYSTEM'
  title: string
  message: string
  isRead: boolean
  relatedUserId?: string
  createdAt: string
}

interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  createdAt: string
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

  // 사용자 탈퇴 (status만 변경)
  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user || user.role === 'ADMIN') return false

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status: 'DELETED' })
      .eq('id', userId)

    return !error
  },

  // 사용자 완전 삭제 (데이터베이스에서 영구 삭제)
  async permanentlyDeleteUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId)
    if (!user || user.role === 'ADMIN') return false

    try {
      // 1. 먼저 거래 내역 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
      await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('user_id', userId)

      // 2. 사용자 삭제
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Permanently delete user error:', error)
      return false
    }
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
    try {
      const { data, error } = await supabaseAdmin
        .from('metadata')
        .select('key, value')
        .in('key', [
          'security_coin_new_user',
          'security_coin_referral',
          'dividend_coin_per_100',
          'dividend_coin_referral_percentage'
        ])

      if (error || !data) {
        // 에러 시 기본값 반환
        return {
          securityCoinNewUser: 500,
          securityCoinReferral: 1000,
          dividendCoinPer100: 10000,
          dividendCoinReferralPercentage: 10
        }
      }

      // metadata 배열을 객체로 변환
      const config: any = {}
      data.forEach(item => {
        config[item.key] = item.value
      })

      return {
        securityCoinNewUser: config.security_coin_new_user || 500,
        securityCoinReferral: config.security_coin_referral || 1000,
        dividendCoinPer100: config.dividend_coin_per_100 || 10000,
        dividendCoinReferralPercentage: config.dividend_coin_referral_percentage || 10
      }
    } catch (error) {
      // 에러 시 기본값 반환
      return {
        securityCoinNewUser: 500,
        securityCoinReferral: 1000,
        dividendCoinPer100: 10000,
        dividendCoinReferralPercentage: 10
      }
    }
  },

  // 시스템 설정 저장
  async saveSystemConfig(config: SystemConfig): Promise<boolean> {
    try {
      const updates = [
        { key: 'security_coin_new_user', value: config.securityCoinNewUser },
        { key: 'security_coin_referral', value: config.securityCoinReferral },
        { key: 'dividend_coin_per_100', value: config.dividendCoinPer100 },
        { key: 'dividend_coin_referral_percentage', value: config.dividendCoinReferralPercentage }
      ]

      for (const update of updates) {
        await supabaseAdmin
          .from('metadata')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString()
          })
      }

      return true
    } catch (error) {
      console.error('Save system config error:', error)
      return false
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
  },

  // ========== 알림 관련 함수들 ==========

  // 알림 생성
  async createNotification(
    userId: string,
    type: 'REFERRAL_SIGNUP' | 'COIN_GRANTED' | 'SYSTEM',
    title: string,
    message: string,
    relatedUserId?: string
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          is_read: false,
          related_user_id: relatedUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create notification error:', error)
        return null
      }

      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: data.is_read,
        relatedUserId: data.related_user_id,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('Create notification error:', error)
      return null
    }
  },

  // 사용자의 알림 목록 조회
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get notifications error:', error)
        return []
      }

      return data.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        relatedUserId: n.related_user_id,
        createdAt: n.created_at
      }))
    } catch (error) {
      console.error('Get notifications error:', error)
      return []
    }
  },

  // 읽지 않은 알림 개수 조회
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Get unread count error:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get unread count error:', error)
      return 0
    }
  },

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Mark notification as read error:', error)
      return false
    }
  },

  // 모든 알림 읽음 처리
  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      return !error
    } catch (error) {
      console.error('Mark all notifications as read error:', error)
      return false
    }
  },

  // 푸시 구독 저장
  async savePushSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        })

      return !error
    } catch (error) {
      console.error('Save push subscription error:', error)
      return false
    }
  },

  // 사용자의 푸시 구독 조회
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Get push subscriptions error:', error)
        return []
      }

      return data.map(s => ({
        id: s.id,
        userId: s.user_id,
        endpoint: s.endpoint,
        p256dh: s.p256dh,
        auth: s.auth,
        createdAt: s.created_at
      }))
    } catch (error) {
      console.error('Get push subscriptions error:', error)
      return []
    }
  },
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
