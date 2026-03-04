import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owudrvqzcsjbfnrenveg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dWRydnF6Y3NqYmZucmVudmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxOTQ4MSwiZXhwIjoyMDc3MDk1NDgxfQ.koTbepOM-onzPcrFau3GJugkxyThZ_mEPB0rlSFsQ7E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoles() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, role, member_number')
    .order('created_at')

  if (error) {
    console.error('Error:', error)
    return
  }

  // 모든 role 값 추출
  const roleSet = new Set(users.map(u => u.role))
  console.log('Unique role values in database:')
  console.log(Array.from(roleSet))

  // 각 role별 카운트
  console.log('\nRole counts:')
  roleSet.forEach(role => {
    const count = users.filter(u => u.role === role).length
    console.log(`  ${role}: ${count}`)
  })

  // 그룹장으로 보이는 사용자 찾기 (이름 기준)
  console.log('\nUsers with "그룹장" or similar in their role/name:')
  const potentialGroupLeaders = users.filter(u =>
    u.name?.includes('그룹장') ||
    u.role?.includes('그룹') ||
    u.role?.includes('GROUP')
  )

  potentialGroupLeaders.forEach(u => {
    console.log(`  ${u.name} - role: "${u.role}" (member: ${u.member_number})`)
  })
}

checkRoles().then(() => process.exit(0))
