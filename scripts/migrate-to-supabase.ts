/**
 * JSON 파일 데이터를 Supabase로 마이그레이션하는 스크립트
 *
 * 사용법:
 * 1. .env.local 파일에 Supabase 자격증명 설정
 * 2. Supabase에서 테이블 생성 (schema.sql 참고)
 * 3. 터미널에서 실행: npx tsx scripts/migrate-to-supabase.ts
 */

// .env.local 파일 로드 (가장 먼저!)
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
config({ path: path.join(process.cwd(), '.env.local') })

// Supabase 클라이언트 직접 생성
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗')
  console.log('\n.env.local 파일을 확인하세요.')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface DatabaseData {
  users: any[]
  transactions: any[]
  systemConfig: {
    currentMemberCount: number
    securityCoinNewUser: number
    securityCoinReferral: number
    dividendCoinPer100: number
    dividendCoinReferral: number
  }
}

async function migrateToSupabase() {
  console.log('🚀 Supabase 마이그레이션 시작...\n')

  try {
    // 1. JSON 파일에서 데이터 읽기
    const dbPath = path.join(process.cwd(), 'data.json')

    if (!fs.existsSync(dbPath)) {
      console.error('❌ data.json 파일을 찾을 수 없습니다.')
      console.log('   경로:', dbPath)
      return
    }

    const fileContent = fs.readFileSync(dbPath, 'utf-8')
    const data: DatabaseData = JSON.parse(fileContent)

    console.log('📊 데이터 통계:')
    console.log(`   - 사용자: ${data.users.length}명`)
    console.log(`   - 거래내역: ${data.transactions.length}건`)
    console.log(`   - 다음 회원번호: ${data.systemConfig.currentMemberCount + 1}\n`)

    // 2. 기존 데이터 확인 (선택사항)
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('count')
      .single()

    if (existingUsers && existingUsers.count > 0) {
      console.log('⚠️  Supabase에 이미 데이터가 있습니다.')
      console.log('   계속하시려면 Supabase의 기존 데이터를 먼저 삭제하세요.\n')
      return
    }

    // 3. 사용자 데이터 마이그레이션
    console.log('👥 사용자 데이터 마이그레이션 중...')

    // 배치로 나눠서 삽입 (한 번에 1000개씩)
    const userBatchSize = 1000
    for (let i = 0; i < data.users.length; i += userBatchSize) {
      const batch = data.users.slice(i, i + userBatchSize)

      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert(batch.map(user => ({
          id: user.id,
          member_number: user.memberNumber,
          email: user.email || `user${user.id}@vcoin.local`,
          password: user.password,
          name: user.name,
          phone: user.phone,
          referral_code: user.referralCode,
          referred_by: user.referrerId || null,
          security_coins: user.securityCoins,
          dividend_coins: user.dividendCoins,
          role: user.role || 'USER',
          is_admin: user.isAdmin || false,
          created_at: user.createdAt
        })))

      if (userError) {
        console.error('❌ 사용자 데이터 삽입 실패:', userError)
        return
      }

      console.log(`   ✓ ${Math.min(i + userBatchSize, data.users.length)}/${data.users.length} 사용자 삽입 완료`)
    }

    // 4. 거래 데이터 마이그레이션
    console.log('\n💰 거래 데이터 마이그레이션 중...')

    const txBatchSize = 1000
    for (let i = 0; i < data.transactions.length; i += txBatchSize) {
      const batch = data.transactions.slice(i, i + txBatchSize)

      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert(batch.map(tx => ({
          id: tx.id,
          user_id: tx.userId,
          type: tx.type,
          coin_type: tx.coinType,
          amount: tx.amount,
          balance: tx.balance,
          description: tx.description,
          created_at: tx.createdAt
        })))

      if (txError) {
        console.error('❌ 거래 데이터 삽입 실패:', txError)
        return
      }

      console.log(`   ✓ ${Math.min(i + txBatchSize, data.transactions.length)}/${data.transactions.length} 거래 삽입 완료`)
    }

    // 5. 메타데이터 저장 (next_member_number)
    console.log('\n⚙️  메타데이터 저장 중...')

    const nextMemberNumber = data.systemConfig.currentMemberCount + 1

    const { error: metaError } = await supabaseAdmin
      .from('metadata')
      .upsert({
        key: 'next_member_number',
        value: nextMemberNumber
      })

    if (metaError) {
      console.error('❌ 메타데이터 저장 실패:', metaError)
      return
    }

    console.log(`   ✓ 다음 회원번호 저장 완료: ${nextMemberNumber}\n`)

    // 6. 검증
    console.log('🔍 데이터 검증 중...')

    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: txCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    console.log(`   - Supabase 사용자: ${userCount}명`)
    console.log(`   - Supabase 거래내역: ${txCount}건\n`)

    if (userCount === data.users.length && txCount === data.transactions.length) {
      console.log('✅ 마이그레이션 성공!')
      console.log('\n다음 단계:')
      console.log('1. Supabase 대시보드에서 데이터 확인')
      console.log('2. lib/db.ts 파일을 Supabase 버전으로 교체')
      console.log('3. 애플리케이션 테스트')
    } else {
      console.log('⚠️  데이터 개수가 일치하지 않습니다. 확인이 필요합니다.')
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error)
  }
}

// 스크립트 실행
migrateToSupabase()
