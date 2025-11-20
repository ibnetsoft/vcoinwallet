import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fhlfjthbhoggqzfokyxz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobGZqdGhiaG9nZ3F6Zm9reXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU4NDQ1MCwiZXhwIjoyMDUyMTYwNDUwfQ.pzssqO8CGbxh_B88P7NiF-Hhe3zWGh0Y-dv-QN62OI4'
)

async function checkReferrer() {
  // 김경철 회원 찾기
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', '01044818013')
    .single()

  if (userError) {
    console.log('User Error:', userError)
    return
  }

  console.log('김경철 회원 정보:')
  console.log('- ID:', user.id)
  console.log('- 이름:', user.name)
  console.log('- 회원번호:', user.member_number)
  console.log('- referred_by (추천인 ID):', user.referred_by)
  console.log('- referral_code (본인 추천코드):', user.referral_code)

  if (user.referred_by) {
    // 추천인 정보 찾기
    const { data: referrer, error: refError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.referred_by)
      .single()

    if (refError) {
      console.log('\n추천인 조회 에러:', refError)
    } else {
      console.log('\n추천인 정보:')
      console.log('- ID:', referrer.id)
      console.log('- 이름:', referrer.name)
      console.log('- 회원번호:', referrer.member_number)
      console.log('- 전화번호:', referrer.phone)
    }
  } else {
    console.log('\n추천인 없음 (referred_by가 null)')
  }
}

checkReferrer()
