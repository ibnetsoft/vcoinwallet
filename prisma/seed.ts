import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // 시스템 설정 초기화
  await prisma.systemConfig.upsert({
    where: { id: 'config' },
    update: {},
    create: {
      id: 'config',
      currentMemberCount: 0,
      securityCoinNewUser: 500,
      securityCoinReferral: 1000,
      dividendCoinPer100: 10000,
      dividendCoinReferral: 1000
    }
  })
  
  // 관리자 계정 생성
  const adminPassword = await hashPassword('admin1234')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@3dvcoin.com' },
    update: {},
    create: {
      email: 'admin@3dvcoin.com',
      password: adminPassword,
      name: '관리자',
      phone: '01000000000',
      referralCode: 'ADMIN1',
      memberNumber: 0,
      securityCoins: 0,
      dividendCoins: 0,
      isAdmin: true
    }
  })
  
  console.log('✅ Admin account created:', {
    email: admin.email,
    password: 'admin1234', // 초기 비밀번호
    referralCode: admin.referralCode
  })
  
  // 테스트 사용자 생성 (선택사항)
  const testPassword = await hashPassword('test1234')
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testPassword,
      name: '테스트유저',
      phone: '01012345678',
      referralCode: 'TEST01',
      memberNumber: 1,
      securityCoins: 1500, // 회원가입 500 + 추천 1000
      dividendCoins: 0,
      isAdmin: false,
      referrerId: admin.id // 관리자가 추천
    }
  })
  
  // 테스트 거래 내역 생성
  await prisma.transaction.create({
    data: {
      userId: testUser.id,
      type: 'SIGNUP_BONUS',
      coinType: 'SECURITY',
      amount: 500,
      balance: 500,
      description: '회원가입 보너스'
    }
  })
  
  await prisma.transaction.create({
    data: {
      userId: admin.id,
      type: 'REFERRAL_BONUS',
      coinType: 'SECURITY',
      amount: 1000,
      balance: 1000,
      description: `추천 보너스 - ${testUser.name}님 가입`,
      referralId: testUser.id
    }
  })
  
  console.log('✅ Test user created:', {
    email: testUser.email,
    password: 'test1234',
    referralCode: testUser.referralCode
  })
  
  console.log('✅ Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
