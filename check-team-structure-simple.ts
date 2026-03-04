import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owudrvqzcsjbfnrenveg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dWRydnF6Y3NqYmZucmVudmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxOTQ4MSwiZXhwIjoyMDc3MDk1NDgxfQ.koTbepOM-onzPcrFau3GJugkxyThZ_mEPB0rlSFsQ7E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTeamStructure() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, role, referred_by, member_number')
    .order('created_at')

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  const teamLeaders = users.filter(u => u.role === 'TEAM_LEADER')

  console.log('=== 팀장 목록 및 산하 구조 확인 ===\n')

  let foundGroupLeaderUnderTeamLeader = false

  teamLeaders.forEach(tl => {
    console.log(`팀장: ${tl.name} (회원번호: ${tl.member_number})`)

    const children = users.filter(u => u.referred_by === tl.id)

    if (children.length === 0) {
      console.log('  └─ (산하 회원 없음)\n')
    } else {
      children.forEach(child => {
        console.log(`  └─ ${child.name} (회원번호: ${child.member_number}, 역할: ${child.role})`)

        if (child.role === 'GROUP_LEADER') {
          console.log('    ⚠️ [경고] 팀장 산하에 그룹장이 있습니다!')
          foundGroupLeaderUnderTeamLeader = true
        }
      })
      console.log('')
    }
  })

  console.log('\n=== 결과 ===')
  if (foundGroupLeaderUnderTeamLeader) {
    console.log('❌ 팀장 산하에 그룹장이 존재합니다. 구조를 수정해야 합니다.')
  } else {
    console.log('✅ 팀장 산하에 그룹장이 없습니다. 정상적인 구조입니다.')
  }
}

checkTeamStructure().then(() => process.exit(0))
