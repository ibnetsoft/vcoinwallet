import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owudrvqzcsjbfnrenveg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dWRydnF6Y3NqYmZucmVudmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxOTQ4MSwiZXhwIjoyMDc3MDk1NDgxfQ.koTbepOM-onzPcrFau3GJugkxyThZ_mEPB0rlSFsQ7E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGroupLeaders() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, role, member_number, phone')
    .order('created_at')

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log('=== 전체 회원 역할 통계 ===')
  const roleStats = {
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    GROUP_LEADER: users.filter(u => u.role === 'GROUP_LEADER').length,
    TEAM_LEADER: users.filter(u => u.role === 'TEAM_LEADER').length,
    USER: users.filter(u => u.role === 'USER').length
  }

  console.log(`관리자: ${roleStats.ADMIN}명`)
  console.log(`그룹장: ${roleStats.GROUP_LEADER}명`)
  console.log(`팀장: ${roleStats.TEAM_LEADER}명`)
  console.log(`일반회원: ${roleStats.USER}명`)
  console.log(`총 회원: ${users.length}명\n`)

  const groupLeaders = users.filter(u => u.role === 'GROUP_LEADER')

  if (groupLeaders.length === 0) {
    console.log('❌ 그룹장이 없습니다.')
  } else {
    console.log('=== 그룹장 목록 ===')
    groupLeaders.forEach(gl => {
      console.log(`- ${gl.name} (회원번호: ${gl.member_number}, 전화: ${gl.phone})`)
    })
  }
}

checkGroupLeaders().then(() => process.exit(0))
