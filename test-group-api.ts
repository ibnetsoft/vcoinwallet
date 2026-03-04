import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owudrvqzcsjbfnrenveg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dWRydnF6Y3NqYmZucmVudmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxOTQ4MSwiZXhwIjoyMDc3MDk1NDgxfQ.koTbepOM-onzPcrFau3GJugkxyThZ_mEPB0rlSFsQ7E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGroupAPI() {
  console.log('=== Testing Group Leader API ===\n')

  // 모든 사용자 조회
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, name, phone, email, referral_code, referred_by, security_coins, dividend_coins, member_number, role, status, created_at')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Users fetch error:', usersError)
    return
  }

  console.log(`Total users: ${allUsers.length}`)

  // 그룹장 목록
  const groupLeaders = allUsers.filter(u => u.role === 'GROUP_LEADER')
  console.log(`Group leaders: ${groupLeaders.length}\n`)

  if (groupLeaders.length === 0) {
    console.log('No group leaders found!')
    return
  }

  // 첫 번째 그룹장 테스트
  const gl = groupLeaders[0]
  console.log(`Testing with: ${gl.name} (ID: ${gl.id})`)

  // 그룹장이 직접 추천한 회원들
  const directMembers = allUsers.filter(u => u.referred_by === gl.id)
  console.log(`Direct members: ${directMembers.length}`)

  directMembers.forEach(m => {
    console.log(`  - ${m.name} (${m.role})`)
  })

  // 직추천한 팀장 수
  const directTeamLeaders = directMembers.filter(m => m.role === 'TEAM_LEADER')
  console.log(`\nDirect team leaders: ${directTeamLeaders.length}`)

  // 재귀적으로 모든 하위 회원 찾기
  const findAllDescendants = (userId: string, users: any[]): string[] => {
    const directChildren = users.filter(u => u.referred_by === userId)
    let descendants = directChildren.map(u => u.id)

    for (const child of directChildren) {
      if (child.role !== 'GROUP_LEADER') {
        descendants = [...descendants, ...findAllDescendants(child.id, users)]
      }
    }

    return descendants
  }

  const descendantIds = findAllDescendants(gl.id, allUsers)
  const allSubMembers = allUsers.filter(u => descendantIds.includes(u.id))

  console.log(`Total sub members (recursive): ${allSubMembers.length}`)

  // 총 배당코인
  const totalDividendCoins = allSubMembers.reduce((sum, u) => sum + (u.dividend_coins || 0), 0)
  console.log(`Total dividend coins: ${totalDividendCoins}`)
}

testGroupAPI().then(() => process.exit(0))
