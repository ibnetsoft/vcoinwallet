import fs from 'fs'
import path from 'path'
import { hashPassword, generateReferralCode, calculateSignupBonus } from './auth'

const DB_PATH = path.join(process.cwd(), 'data.json')

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
  role: 'ADMIN' | 'TEAM_LEADER' | 'USER'  // 관리자, 팀장, 일반회원
  isAdmin: boolean  // 하위 호환성을 위해 유지
  status?: 'ACTIVE' | 'BLOCKED' | 'DELETED'  // 계정 상태
  createdAt: string
  updatedAt: string
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

interface Database {
  users: User[]
  transactions: Transaction[]
  systemConfig: {
    currentMemberCount: number
    securityCoinNewUser: number
    securityCoinReferral: number
    dividendCoinPer100: number
    dividendCoinReferral: number
  }
}

// 데이터베이스 초기화
function initDB(): Database {
  return {
    users: [],
    transactions: [],
    systemConfig: {
      currentMemberCount: 0,
      securityCoinNewUser: 500,
      securityCoinReferral: 1000,
      dividendCoinPer100: 10000,
      dividendCoinReferral: 1000
    }
  }
}

// 데이터베이스 읽기
function readDB(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDB = initDB()
      writeDB(initialDB)
      return initialDB
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('DB 읽기 오류:', error)
    return initDB()
  }
}

// 데이터베이스 쓰기
function writeDB(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('DB 쓰기 오류:', error)
  }
}

// 사용자 관련 함수들
export const db = {
  // 사용자 찾기
  findUserByPhone(phone: string): User | null {
    const database = readDB()
    return database.users.find(u => u.phone === phone) || null
  },

  findUserByEmail(email: string): User | null {
    const database = readDB()
    return database.users.find(u => u.email === email) || null
  },

  findUserById(id: string): User | null {
    const database = readDB()
    return database.users.find(u => u.id === id) || null
  },

  findUserByReferralCode(code: string): User | null {
    const database = readDB()
    return database.users.find(u => u.referralCode === code) || null
  },
  
  // 사용자 생성
  createUser(data: {
    name: string
    phone: string
    email?: string
    password: string
    referralCode?: string
  }): User {
    const database = readDB()

    // 회원 번호 증가
    database.systemConfig.currentMemberCount++
    const memberNumber = database.systemConfig.currentMemberCount

    // 보너스 계산
    const { securityCoins, referralBonus } = calculateSignupBonus(memberNumber)

    // 추천인 확인
    let referrer = null
    if (data.referralCode) {
      referrer = database.users.find(u => u.referralCode === data.referralCode)
    }

    // 새 사용자 생성
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      password: data.password,  // 평문 비밀번호 저장 (암호화하지 않음)
      referralCode: generateReferralCode(),
      referrerId: referrer?.id,
      securityCoins,
      dividendCoins: 0,
      memberNumber,
      role: 'USER',  // 기본값: 일반회원
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    database.users.push(newUser)
    
    // 가입 보너스 거래 기록
    database.transactions.push({
      id: Date.now().toString(),
      userId: newUser.id,
      type: 'SIGNUP_BONUS',
      coinType: 'SECURITY',
      amount: securityCoins,
      balance: securityCoins,
      description: `회원가입 보너스 (회원번호: ${memberNumber})`,
      createdAt: new Date().toISOString()
    })
    
    // 추천인 보너스 지급
    if (referrer) {
      const referrerIndex = database.users.findIndex(u => u.id === referrer.id)
      database.users[referrerIndex].securityCoins += referralBonus
      
      database.transactions.push({
        id: (Date.now() + 1).toString(),
        userId: referrer.id,
        type: 'REFERRAL_BONUS',
        coinType: 'SECURITY',
        amount: referralBonus,
        balance: database.users[referrerIndex].securityCoins,
        description: `추천 보너스 - ${newUser.name}님 가입`,
        referralId: newUser.id,
        createdAt: new Date().toISOString()
      })
    }
    
    writeDB(database)
    return newUser
  },
  
  // 배당코인 지급
  grantDividendCoins(userId: string, amount: number, description?: string): boolean {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    const user = database.users[userIndex]
    database.users[userIndex].dividendCoins += amount

    // 거래 기록 생성
    database.transactions.push({
      id: Date.now().toString(),
      userId: user.id,
      type: 'ADMIN_GRANT',
      coinType: 'DIVIDEND',
      amount: amount,
      balance: database.users[userIndex].dividendCoins,
      description: description || '관리자 수동 지급',
      createdAt: new Date().toISOString()
    })

    // 추천인 보너스 자동 지급 (항상 지급)
    if (user.referrerId) {
      const referrerIndex = database.users.findIndex(u => u.id === user.referrerId)
      if (referrerIndex !== -1) {
        // 코인 설정에서 추천인 보너스 값 가져오기 (기본값: 1000)
        let bonusAmount = 1000
        try {
          if (typeof localStorage !== 'undefined') {
            const coinSettings = localStorage.getItem('coinSettings')
            if (coinSettings) {
              const settings = JSON.parse(coinSettings)
              bonusAmount = settings.referralBonus || 1000
            }
          }
        } catch (e) {
          // localStorage 접근 불가 시 기본값 사용
          bonusAmount = 1000
        }

        database.users[referrerIndex].dividendCoins += bonusAmount

        database.transactions.push({
          id: (Date.now() + 1).toString(),
          userId: user.referrerId,
          type: 'REFERRAL_BONUS',
          coinType: 'DIVIDEND',
          amount: bonusAmount,
          balance: database.users[referrerIndex].dividendCoins,
          description: `추천 보너스 - ${user.name}님 배당코인 구매`,
          referralId: user.id,
          createdAt: new Date().toISOString()
        })
      }
    }

    writeDB(database)
    return true
  },

  // 배당코인 수정 (추천인 보너스 없음)
  setDividendCoins(userId: string, amount: number, description?: string): boolean {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    const user = database.users[userIndex]
    const oldAmount = database.users[userIndex].dividendCoins
    database.users[userIndex].dividendCoins = amount

    // 거래 기록 생성
    database.transactions.push({
      id: Date.now().toString(),
      userId: user.id,
      type: 'ADMIN_GRANT',
      coinType: 'DIVIDEND',
      amount: amount - oldAmount, // 변경된 차액
      balance: database.users[userIndex].dividendCoins,
      description: description || `배당코인 수정 - ${amount}개로 변경`,
      createdAt: new Date().toISOString()
    })

    writeDB(database)
    return true
  },

  // 사용자 정보 업데이트
  updateUser(userId: string, updateData: Partial<User>): User | null {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return null

    database.users[userIndex] = {
      ...database.users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    writeDB(database)
    return database.users[userIndex]
  },

  // 모든 사용자 가져오기
  getAllUsers(): User[] {
    const database = readDB()
    return database.users
  },

  // 회원 차단
  blockUser(userId: string): boolean {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    // 관리자는 차단할 수 없음
    if (database.users[userIndex].role === 'ADMIN') return false

    database.users[userIndex].status = 'BLOCKED'
    database.users[userIndex].updatedAt = new Date().toISOString()

    writeDB(database)
    return true
  },

  // 회원 차단 해제
  unblockUser(userId: string): boolean {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    database.users[userIndex].status = 'ACTIVE'
    database.users[userIndex].updatedAt = new Date().toISOString()

    writeDB(database)
    return true
  },

  // 회원 탈퇴 처리
  deleteUser(userId: string): boolean {
    const database = readDB()
    const userIndex = database.users.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    // 관리자는 탈퇴 처리할 수 없음
    if (database.users[userIndex].role === 'ADMIN') return false

    database.users[userIndex].status = 'DELETED'
    database.users[userIndex].updatedAt = new Date().toISOString()

    writeDB(database)
    return true
  },
  
  // 거래 내역 가져오기
  getTransactions(userId: string): Transaction[] {
    const database = readDB()
    return database.transactions.filter(t => t.userId === userId)
  },
  
  // 기존 사용자 role 필드 마이그레이션
  migrateUserRoles() {
    const database = readDB()
    let migrated = false

    database.users = database.users.map(user => {
      if (!user.role) {
        migrated = true
        return {
          ...user,
          role: user.isAdmin ? 'ADMIN' : 'USER'
        }
      }
      return user
    })

    if (migrated) {
      writeDB(database)
      console.log('✅ User roles migrated successfully')
    }
  },

  // 초기 데이터 설정
  async initializeData() {
    const database = readDB()

    // 기존 사용자 role 마이그레이션
    this.migrateUserRoles()

    // 이미 데이터가 있으면 스킵
    if (database.users.length > 0) {
      console.log('Database already initialized')
      return
    }
    
    // 관리자 계정 생성
    const adminPassword = await hashPassword('admin1234')
    const admin: User = {
      id: '1',
      name: '관리자',
      phone: '01000000000',
      email: 'admin@3dvcoin.com',
      password: adminPassword,
      referralCode: 'ADMIN1',
      securityCoins: 0,
      dividendCoins: 0,
      memberNumber: 0,
      role: 'ADMIN',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    database.users.push(admin)

    console.log('✅ Admin account created:')
    console.log('Phone: 01000000000')
    console.log('Email: admin@3dvcoin.com')
    console.log('Password: admin1234')
    
    writeDB(database)
  }
}

// 앱 시작 시 초기화
db.initializeData()
