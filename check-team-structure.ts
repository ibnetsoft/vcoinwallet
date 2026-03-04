import { supabaseAdmin } from './lib/supabase'

async function checkTeamStructure() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, role, referrer_id, member_number')
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

    const children = users.filter(u => u.referrer_id === tl.id)

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
